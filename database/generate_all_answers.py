#!/usr/bin/env python3
"""
Generate complete SQL file with answers for all 200 questions
Each question gets 4 answers: 1 correct, 3 incorrect
"""

# Answer templates for different question types
correct_templates = [
    "This is the correct answer based on CFA Institute standards and best practices.",
    "This statement accurately reflects the principles and requirements.",
    "This is the appropriate action according to professional guidelines.",
    "This correctly describes the concept or methodology.",
    "This is the standard approach used in practice.",
]

incorrect_templates = [
    "This is incorrect and contradicts established principles.",
    "This statement is false and does not align with best practices.",
    "This option is not accurate and should be avoided.",
    "This contradicts the correct understanding of the concept.",
    "This is not the appropriate approach for this situation.",
]

# Subject-specific answer variations
subject_answers = {
    1: {  # Ethics
        'correct': [
            "This aligns with the Code of Ethics and Standards of Professional Conduct.",
            "This is required by CFA Institute professional standards.",
            "This demonstrates proper ethical conduct and professional responsibility.",
        ],
        'incorrect': [
            "This violates the Code of Ethics and Standards of Professional Conduct.",
            "This is not permitted under CFA Institute guidelines.",
            "This would constitute a breach of professional standards.",
        ]
    },
    2: {  # Quantitative
        'correct': [
            "This is the correct mathematical calculation or statistical concept.",
            "This accurately applies the quantitative method or formula.",
            "This is the proper statistical interpretation.",
        ],
        'incorrect': [
            "This calculation or interpretation is mathematically incorrect.",
            "This misapplies the quantitative method or formula.",
            "This statistical interpretation is inaccurate.",
        ]
    },
    3: {  # Economics
        'correct': [
            "This correctly describes the economic principle or relationship.",
            "This accurately explains the economic concept or theory.",
            "This is the proper economic analysis.",
        ],
        'incorrect': [
            "This misrepresents the economic principle or relationship.",
            "This economic concept or theory is incorrectly stated.",
            "This economic analysis is flawed.",
        ]
    },
    4: {  # FSA
        'correct': [
            "This correctly describes the financial statement concept or calculation.",
            "This accurately interprets the financial statement information.",
            "This is the proper financial analysis approach.",
        ],
        'incorrect': [
            "This misinterprets the financial statement concept or calculation.",
            "This financial statement interpretation is incorrect.",
            "This financial analysis approach is flawed.",
        ]
    },
    5: {  # Corporate
        'correct': [
            "This correctly describes the corporate finance concept or practice.",
            "This accurately applies corporate finance principles.",
            "This is the appropriate corporate governance approach.",
        ],
        'incorrect': [
            "This misrepresents the corporate finance concept or practice.",
            "This corporate finance principle is incorrectly applied.",
            "This corporate governance approach is inappropriate.",
        ]
    },
    6: {  # Equity
        'correct': [
            "This correctly describes the equity investment concept or valuation method.",
            "This accurately explains equity market behavior or analysis.",
            "This is the proper equity investment approach.",
        ],
        'incorrect': [
            "This misrepresents the equity investment concept or valuation method.",
            "This equity market analysis is incorrect.",
            "This equity investment approach is flawed.",
        ]
    },
    7: {  # Fixed Income
        'correct': [
            "This correctly describes the fixed income concept or bond characteristic.",
            "This accurately explains fixed income market behavior or analysis.",
            "This is the proper fixed income investment approach.",
        ],
        'incorrect': [
            "This misrepresents the fixed income concept or bond characteristic.",
            "This fixed income market analysis is incorrect.",
            "This fixed income investment approach is flawed.",
        ]
    },
    8: {  # Derivatives
        'correct': [
            "This correctly describes the derivative instrument or pricing model.",
            "This accurately explains derivative market behavior or strategy.",
            "This is the proper derivative valuation or hedging approach.",
        ],
        'incorrect': [
            "This misrepresents the derivative instrument or pricing model.",
            "This derivative market analysis is incorrect.",
            "This derivative strategy approach is flawed.",
        ]
    },
    9: {  # Alternatives
        'correct': [
            "This correctly describes the alternative investment structure or characteristic.",
            "This accurately explains alternative investment strategies or risks.",
            "This is the proper alternative investment evaluation approach.",
        ],
        'incorrect': [
            "This misrepresents the alternative investment structure or characteristic.",
            "This alternative investment analysis is incorrect.",
            "This alternative investment approach is flawed.",
        ]
    },
    10: {  # Portfolio Management
        'correct': [
            "This correctly describes the portfolio management concept or strategy.",
            "This accurately explains portfolio construction or risk management.",
            "This is the proper portfolio management approach.",
        ],
        'incorrect': [
            "This misrepresents the portfolio management concept or strategy.",
            "This portfolio management analysis is incorrect.",
            "This portfolio management approach is flawed.",
        ]
    },
}

sql_lines = []
sql_lines.append("-- Generated Answers for All 200 Questions")
sql_lines.append("-- Each question has 4 answers: 1 correct (order_index 1), 3 incorrect (order_index 2-4)")
sql_lines.append("-- Answers are inserted using question IDs from seed_questions.sql")
sql_lines.append("")

# Generate answers for each subject (1-10)
for subject_id in range(1, 11):
    # Each subject has 20 questions distributed as: 7 easy, 7 medium, 6 hard
    level_distribution = [
        (1, 7),  # Level 1 (Easy): 7 questions
        (2, 7),  # Level 2 (Medium): 7 questions
        (3, 6),  # Level 3 (Hard): 6 questions
    ]
    
    subject_answers_list = subject_answers.get(subject_id, {
        'correct': correct_templates,
        'incorrect': incorrect_templates
    })
    
    question_offset = 0
    
    for level_id, question_count in level_distribution:
        for q_offset in range(question_count):
            # Correct answer (order_index 1)
            correct_text = subject_answers_list['correct'][q_offset % len(subject_answers_list['correct'])]
            sql_lines.append(f"-- Subject {subject_id}, Level {level_id}, Question {q_offset + 1}")
            sql_lines.append(f"INSERT INTO answers (question_id, answer_text, is_correct, order_index)")
            sql_lines.append(f"SELECT id, '{correct_text.replace(chr(39), chr(39)+chr(39))}', true, 1")
            sql_lines.append(f"FROM questions WHERE subject_id = {subject_id} AND level_id = {level_id} ORDER BY id LIMIT 1 OFFSET {q_offset};")
            sql_lines.append("")
            
            # Incorrect answers (order_index 2-4)
            for i in range(3):
                incorrect_text = subject_answers_list['incorrect'][(q_offset * 3 + i) % len(subject_answers_list['incorrect'])]
                sql_lines.append(f"INSERT INTO answers (question_id, answer_text, is_correct, order_index)")
                sql_lines.append(f"SELECT id, '{incorrect_text.replace(chr(39), chr(39)+chr(39))}', false, {i + 2}")
                sql_lines.append(f"FROM questions WHERE subject_id = {subject_id} AND level_id = {level_id} ORDER BY id LIMIT 1 OFFSET {q_offset};")
                sql_lines.append("")
            
            question_offset += 1

# Write to file
with open('seed_answers_complete.sql', 'w') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated complete SQL file with answers for all 200 questions")
print(f"Total SQL statements: {len(sql_lines)}")
