package com.skillgap.backend.service;

import com.skillgap.backend.model.SkillResult;
import com.skillgap.backend.model.User;
import com.skillgap.backend.repository.SkillResultRepository;
import com.skillgap.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillResultRepository skillResultRepository;

    // ── Signup ──────────────────────────────────────────
    public Map<String, Object> signup(String name, String email, String password) {
        Map<String, Object> response = new HashMap<>();
        if (userRepository.existsByEmail(email)) {
            response.put("success", false);
            response.put("message", "Email already registered.");
            return response;
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password);
        User saved = userRepository.save(user);

        response.put("success", true);
        response.put("id", saved.getId());
        response.put("name", saved.getName());
        response.put("email", saved.getEmail());
        response.put("isNew", true);
        return response;
    }

    // ── Login ───────────────────────────────────────────
    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> found = userRepository.findByEmail(email);

        if (found.isEmpty() || !found.get().getPassword().equals(password)) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return response;
        }

        User user = found.get();
        List<SkillResult> history = skillResultRepository.findByUserIdOrderBySavedAtDesc(user.getId());

        response.put("success", true);
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("isNew", history.isEmpty());
        response.put("history", history.stream().map(this::mapResult).toList());
        return response;
    }

    // ── Save Result ─────────────────────────────────────
    public Map<String, Object> saveResult(Long userId, String role, Double matchScore,
                                           String matchedSkills, String missingSkills) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> found = userRepository.findById(userId);
        if (found.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found.");
            return response;
        }
        SkillResult result = new SkillResult();
        result.setUser(found.get());
        result.setRole(role);
        result.setMatchScore(matchScore);
        result.setMatchedSkills(matchedSkills);
        result.setMissingSkills(missingSkills);
        skillResultRepository.save(result);

        response.put("success", true);
        return response;
    }

    // ── Delete Account ──────────────────────────────────
    public Map<String, Object> deleteAccount(Long userId) {
        Map<String, Object> response = new HashMap<>();
        if (!userRepository.existsById(userId)) {
            response.put("success", false);
            response.put("message", "User not found.");
            return response;
        }
        userRepository.deleteById(userId);
        response.put("success", true);
        return response;
    }

    // ── Helper ──────────────────────────────────────────
    private Map<String, Object> mapResult(SkillResult r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("role", r.getRole());
        map.put("match_score", r.getMatchScore());
        map.put("matched_skills", r.getMatchedSkills() != null ? List.of(r.getMatchedSkills().split(",")) : List.of());
        map.put("missing_skills", r.getMissingSkills() != null ? List.of(r.getMissingSkills().split(",")) : List.of());
        map.put("savedAt", r.getSavedAt());
        return map;
    }
}