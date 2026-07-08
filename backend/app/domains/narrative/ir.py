# --- from schemas/ir.py ---
"""
Narrative IR — Python 侧镜像（ADR-008）

必须与 @axiforge/core 的 packages/core/src/ir.ts 保持一致。
后端编译器（services/compiler.py）产出本结构，经 /play/story/{id} 下发，
由前端 @axiforge/core 引擎播放。

字段命名统一 camelCase，与 TS 侧一致（FastAPI 默认按 alias 序列化）。
条件/效果为透传 JSON（真相源在 @axiforge/core 的类型，v1.2 统一 schema）。
"""

from typing import Annotated, Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# 演出指令集 v0（8 条，ADR-009）
# ============================================================


class SayInstruction(BaseModel):
    op: Literal["say"] = "say"
    characterId: Optional[str] = None
    speaker: Optional[str] = None
    text: str
    voice: Optional[str] = None
    rich: Optional[bool] = None


class NarrationInstruction(BaseModel):
    op: Literal["narration"] = "narration"
    text: str
    voice: Optional[str] = None
    rich: Optional[bool] = None


class ShowInstruction(BaseModel):
    op: Literal["show"] = "show"
    characterId: str
    expression: Optional[str] = None
    position: Optional[str] = None
    transition: Optional[str] = None


class HideInstruction(BaseModel):
    op: Literal["hide"] = "hide"
    characterId: str
    transition: Optional[str] = None


class MoveInstruction(BaseModel):
    op: Literal["move"] = "move"
    characterId: str
    position: str
    ms: Optional[int] = None


class BgInstruction(BaseModel):
    op: Literal["bg"] = "bg"
    image: str
    transition: Optional[str] = None


class BgmInstruction(BaseModel):
    op: Literal["bgm"] = "bgm"
    track: Optional[str] = None
    fadeMs: Optional[int] = None
    loop: Optional[bool] = None


class SeInstruction(BaseModel):
    op: Literal["se"] = "se"
    sound: str


class VoiceInstruction(BaseModel):
    op: Literal["voice"] = "voice"
    sound: Optional[str] = None


class CameraInstruction(BaseModel):
    op: Literal["camera"] = "camera"
    action: Literal["zoom", "pan", "shake", "reset"]
    scale: Optional[float] = None
    x: Optional[float] = None
    y: Optional[float] = None
    intensity: Optional[float] = None
    ms: Optional[int] = None


class TransitionEffectInstruction(BaseModel):
    op: Literal["transition"] = "transition"
    kind: Literal["fade", "dissolve", "wipe", "cut"]
    ms: Optional[int] = None


class FxInstruction(BaseModel):
    op: Literal["fx"] = "fx"
    effect: Literal["flash", "rain", "snow", "sakura", "none"]
    ms: Optional[int] = None


class WaitInstruction(BaseModel):
    op: Literal["wait"] = "wait"
    ms: int


class ChoiceOption(BaseModel):
    label: str
    to: Optional[str] = None
    condition: Optional[Dict[str, Any]] = None


class ChoiceInstruction(BaseModel):
    op: Literal["choice"] = "choice"
    options: List[ChoiceOption] = []


Instruction = Annotated[
    Union[
        SayInstruction,
        NarrationInstruction,
        ShowInstruction,
        HideInstruction,
        MoveInstruction,
        BgInstruction,
        BgmInstruction,
        SeInstruction,
        VoiceInstruction,
        CameraInstruction,
        TransitionEffectInstruction,
        FxInstruction,
        WaitInstruction,
        ChoiceInstruction,
    ],
    Field(discriminator="op"),
]


# ============================================================
# Flow 层：Beat + Transition
# ============================================================


class Transition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from")
    to: str
    label: Optional[str] = None


class Beat(BaseModel):
    id: str
    sceneId: Optional[str] = None
    sceneTitle: Optional[str] = None
    stage: Optional[str] = None
    actors: List[str] = []
    props: List[str] = []
    trigger: Optional[Dict[str, Any]] = None
    script: List[Instruction] = []
    effects: List[Dict[str, Any]] = []
    isEnding: bool = False
    endingLabel: Optional[str] = None


# ============================================================
# 资产引用清单
# ============================================================


class CharacterRef(BaseModel):
    id: str
    name: str
    imagePath: Optional[str] = None
    expressions: Optional[Dict[str, str]] = None


class GlossaryEntry(BaseModel):
    id: str
    term: str
    definition: str


class CharacterProfile(BaseModel):
    id: str
    name: str
    imagePath: Optional[str] = None
    summary: Optional[str] = None
    essence: Optional[str] = None
    identity: Optional[str] = None
    appearance: Optional[str] = None
    tags: List[str] = []


class SceneRef(BaseModel):
    id: str
    title: str
    location: Optional[str] = None
    atmosphere: Optional[str] = None
    backgroundImage: Optional[str] = None


class ItemRef(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    imagePath: Optional[str] = None


# ============================================================
# StoryPackage — 编译产物
# ============================================================


class StoryPackage(BaseModel):
    irVersion: Literal[1] = 1
    projectId: str
    title: str
    startBeatId: Optional[str] = None
    beats: List[Beat] = []
    transitions: List[Transition] = []
    characters: List[CharacterRef] = []
    scenes: List[SceneRef] = []
    items: List[ItemRef] = []
    worldSetting: Optional[str] = None
    glossary: List[GlossaryEntry] = []
    characterProfiles: List[CharacterProfile] = []
    codexScope: List[str] = []
