package com.skillgap.backend.model;

import java.util.List;

public class SkillRequest {

    private List<String> user_skills;
    private String role;

    public List<String> getUser_skills() {
        return user_skills;
    }

    public void setUser_skills(List<String> user_skills) {
        this.user_skills = user_skills;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}