package com.expensetracker.controller;

import com.expensetracker.model.Expense;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ExpenseController — REST API Layer.
 *
 * KEY CHANGE FROM MySQL VERSION:
 *   - All {id} path variables are now String instead of Long
 *     because MongoDB uses ObjectId strings like "661f3b2a4f1c2d3e4a5b6c7d"
 *     instead of auto-increment numbers like 1, 2, 3
 *
 * API endpoints are identical — the frontend doesn't need to change at all!
 */
@RestController
@RequestMapping("/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    // GET /expenses  or  GET /expenses?category=Food
    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses(
            @RequestParam(required = false) String category) {

        List<Expense> expenses = (category != null && !category.isBlank())
                ? expenseService.getExpensesByCategory(category)
                : expenseService.getAllExpenses();

        return ResponseEntity.ok(expenses);
    }

    // POST /expenses
    @PostMapping
    public ResponseEntity<?> addExpense(@Valid @RequestBody Expense expense) {
        try {
            Expense saved = expenseService.addExpense(expense);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DELETE /expenses/{id}   ← id is now a String, not a Long
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable String id) {
        try {
            expenseService.deleteExpense(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Expense deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    // GET /expenses/total
    @GetMapping("/total")
    public ResponseEntity<Map<String, BigDecimal>> getTotalExpenses() {
        Map<String, BigDecimal> response = new HashMap<>();
        response.put("total", expenseService.getTotalExpenses());
        return ResponseEntity.ok(response);
    }

    // GET /expenses/categories
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(expenseService.getAllCategories());
    }

    // GET /expenses/{id}    ← id is now a String
    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable String id) {
        return expenseService.getExpenseById(id)
                .map(expense -> ResponseEntity.ok().body((Object) expense))
                .orElseGet(() -> {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Expense not found with id: " + id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
                });
    }
}
