package com.expensetracker;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ExpenseTrackerApplication {

    public static void main(String[] args) {
        // Load .env for local development if OS environment variable is not set.
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        if (System.getenv("MONGODB") == null && System.getProperty("MONGODB") == null) {
            String mongoFromDotenv = dotenv.get("MONGODB");
            if (mongoFromDotenv != null && !mongoFromDotenv.isBlank()) {
                System.setProperty("MONGODB", mongoFromDotenv);
            }
        }

        SpringApplication.run(ExpenseTrackerApplication.class, args);
        System.out.println("✅ Expense Tracker Backend is running at http://localhost:8080");
    }
}