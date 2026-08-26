use serde::Deserialize;
use tauri::Manager;

#[derive(Deserialize)]
struct Stmt {
    sql: String,
    #[serde(default)]
    params: Vec<serde_json::Value>,
}

/// 单连接事务：全部语句原子执行（任一失败整体回滚）——I4 的桌面落地点。
#[tauri::command]
async fn sql_transaction(
    app: tauri::AppHandle,
    db_name: String,
    stmts: Vec<Stmt>,
) -> Result<u64, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    // 路径含空格（Application Support）时 sqlite:// URL 会解析失败，改用 options.filename
    let opts = sqlx::sqlite::SqliteConnectOptions::new()
        .create_if_missing(true)
        .foreign_keys(true)
        .filename(dir.join(&db_name));
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await
        .map_err(|e| e.to_string())?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut affected: u64 = 0;
    for s in &stmts {
        let mut q = sqlx::query(&s.sql);
        for pv in &s.params {
            q = match pv {
                serde_json::Value::Null => q.bind(Option::<String>::None),
                serde_json::Value::Bool(b) => q.bind(*b),
                serde_json::Value::Number(n) => {
                    if let Some(i) = n.as_i64() { q.bind(i) } else { q.bind(n.as_f64()) }
                }
                serde_json::Value::String(sv) => q.bind(sv.clone()),
                other => q.bind(other.to_string()),
            };
        }
        match q.execute(&mut *tx).await {
            Ok(r) => affected += r.rows_affected(),
            Err(e) => {
                let _ = tx.rollback().await;
                pool.close().await;
                return Err(format!("{e} @ {}", s.sql));
            }
        }
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    pool.close().await;
    Ok(affected)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![sql_transaction])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
