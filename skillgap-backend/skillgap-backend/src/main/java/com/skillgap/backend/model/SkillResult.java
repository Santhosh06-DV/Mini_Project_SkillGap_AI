package com.skillgap.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "skill_results")
public class SkillResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role;

    @Column(name = "match_score")
    private Double matchScore;

    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills; // stored as comma-separated

    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills; // stored as comma-separated

    @Column(name = "saved_at")
    private LocalDateTime savedAt = LocalDateTime.now();
}