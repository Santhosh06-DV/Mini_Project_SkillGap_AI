from fastapi import FastAPI
from pydantic import BaseModel
from skill_analyzer import analyze_skills

app = FastAPI()

class SkillRequest(BaseModel):
    user_skills: list[str]
    role: str

@app.get("/")
def home():
    return {"message": "AI Skill Gap Analyzer API running"}

@app.post("/analyze")
def analyze(request: SkillRequest):

    result = analyze_skills(request.user_skills, request.role)

    return result