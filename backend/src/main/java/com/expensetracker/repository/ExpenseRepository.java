package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ExpenseRepository — Data Access Layer for MongoDB.
 *
 * KEY CHANGES FROM MySQL VERSION:
 *   ❌ Was: JpaRepository<Expense, Long>   (Long because MySQL used numeric ID)
 *   ✅ Now: MongoRepository<Expense, String> (String because MongoDB uses ObjectId strings)
 *
 * Everything else works the same!
 * Spring Data automatically implements all these methods — you don't write the code.
 *
 * MongoDB equivalent of SQL:
 *   findAll()              →  db.expenses.find()
 *   findById("abc123")     →  db.expenses.findOne({_id: "abc123"})
 *   save(expense)          →  db.expenses.insertOne({...})
 *   deleteById("abc123")   →  db.expenses.deleteOne({_id: "abc123"})
 */
@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {
    //                                        ↑             ↑      ↑
    //                             MongoDB repo     Entity   ID type (String for MongoDB)

    /**
     * Find all expenses for a specific category.
     * MongoDB equivalent: db.expenses.find({ category: "Food" })
     */
    List<Expense> findByCategory(String category);

    /**
     * Find all expenses ordered by date descending (newest first).
     * MongoDB equivalent: db.expenses.find().sort({ date: -1 })
     */
    List<Expense> findAllByOrderByDateDesc();

    /**
     * Find all distinct categories.
     * Uses MongoDB Query syntax.
     */
    @Query(value = "{}", fields = "{ 'category': 1 }")
    List<Expense> findAllCategories();
}
