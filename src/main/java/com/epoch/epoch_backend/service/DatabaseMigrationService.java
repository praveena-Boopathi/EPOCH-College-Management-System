package com.epoch.epoch_backend.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
public class DatabaseMigrationService {

    private final UserService userService;
    private final ChatService chatService;

    public DatabaseMigrationService(UserService userService, ChatService chatService) {
        this.userService = userService;
        this.chatService = chatService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        new Thread(() -> {
            try {
                System.out.println("[EPOCH MIGRATION] Reconciling accepted message requests into persistent conversations...");
                int chatCount = chatService.reconcileAcceptedRequests();
                System.out.println("[EPOCH MIGRATION] Accepted message requests reconciliation completed. Reconciled conversations: " + chatCount);
            } catch (Exception e) {
                System.err.println("[EPOCH MIGRATION] Chat reconciliation notice: " + e.getMessage());
            }

            try {
                System.out.println("[EPOCH MIGRATION] Verifying student academic years to '" + UserService.CURRENT_ACADEMIC_YEAR + "'...");
                int count = userService.migrateStudentAcademicYears();
                System.out.println("[EPOCH MIGRATION] Student academic year verification completed. Updated records: " + count);
            } catch (Exception e) {
                System.err.println("[EPOCH MIGRATION] Migration notice: " + e.getMessage());
            }
        }).start();
    }
}
