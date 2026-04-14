package com.expensetracker.service;

import com.expensetracker.model.Expense;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * ExpenseService — Business Logic Layer.
 *
 * KEY CHANGES FROM MySQL VERSION:
 *   - deleteExpense now takes a String ID (not Long)
 *   - getTotalExpenses() uses Java Streams instead of a JPQL query
 *     (MongoDB doesn't use JPQL — we calculate in Java instead)
 *   - getAllCategories() uses Java Streams to get distinct categories
 */
@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    /**
     * Get all expenses, ordered by date (newest first).
     */
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByOrderByDateDesc();
    }

    /**
     * Get expenses filtered by category.
     * If category is blank, returns all.
     */
    public List<Expense> getExpensesByCategory(String category) {
        if (category == null || category.isBlank()) {
            return getAllExpenses();
        }
        return expenseRepository.findByCategory(category);
    }

    /**
     * Save a new expense to MongoDB.
     */
    public Expense addExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    /**
     * Delete an expense by its MongoDB ObjectId (String).
     *
     * NOTE: ID is now a String like "661f3b2a4f1c2d3e4a5b6c7d"
     *       not a Long like 1, 2, 3 (that was MySQL)
     */
    public void deleteExpense(String id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    /**
     * Calculate total of all expenses.
     *
     * MongoDB doesn't support JPQL (that's a SQL thing).
     * Instead we use Java Streams to sum up the amounts.
     *
     * This is equivalent to: SELECT SUM(amount) FROM expenses
     */
    public BigDecimal getTotalExpenses() {
        return expenseRepository.findAll()
                .stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get all distinct category names used across expenses.
     * Uses Java Streams — MongoDB's equivalent of SELECT DISTINCT category
     */
    public List<String> getAllCategories() {
        return expenseRepository.findAll()
                .stream()
                .map(Expense::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Find a single expense by its ID.
     */
    public Optional<Expense> getExpenseById(String id) {
        return expenseRepository.findById(id);
    }
}
