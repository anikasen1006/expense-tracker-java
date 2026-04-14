package com.expensetracker.model;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Expense Document — maps to the "expenses" collection in MongoDB.
 *
 * KEY CHANGES FROM MySQL VERSION:
 *   ❌ Removed: @Entity, @Table (these are JPA/MySQL annotations)
 *   ✅ Added:   @Document (tells Spring this is a MongoDB document)
 *
 *   ❌ Removed: @GeneratedValue (MySQL auto-increment)
 *   ✅ MongoDB auto-generates a unique String ID (called ObjectId)
 *      Example ID: "661f3b2a4f1c2d3e4a5b6c7d"
 *
 * In MongoDB, data is stored as JSON-like documents, e.g.:
 * {
 *   "_id": "661f3b2a4f1c2d3e4a5b6c7d",
 *   "title": "Grocery shopping",
 *   "amount": 1250.50,
 *   "category": "Food",
 *   "date": "2025-04-14"
 * }
 */
@Document(collection = "expenses")   // ← MongoDB: which collection to store in
@Data                                // Lombok: getters, setters, toString, etc.
@NoArgsConstructor                   // Lombok: no-args constructor
@AllArgsConstructor                  // Lombok: all-args constructor
public class Expense {

    @Id  // ← MongoDB ID (String, not Long — MongoDB generates "ObjectId" strings)
    private String id;

    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 100, message = "Title must be between 2 and 100 characters")
    private String title;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Date is required")
    private LocalDate date;
}
