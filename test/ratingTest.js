import { calculateOverallRating } from '../src/utils/calculateRating.js';

const runTests = () => {
    console.log('Running Rating Calculation Tests...');

    const testCases = [
        {
            name: 'Dine-in: All ratings provided',
            input: {
                visit_type: 'Dine-in',
                rating_food: '5',
                rating_service: '4',
                rating_ambience: '3',
                rating_value: '5'
            },
            expected: '8.9' // (10*0.5 + 8*0.25 + 6*0.15 + 10*0.1) = 5 + 2 + 0.9 + 1 = 8.9
        },
        {
            name: 'Dine-in: Partial ratings (Food only)',
            input: {
                visit_type: 'Dine-in',
                rating_food: '5'
            },
            expected: '10.0' // (10*0.5) / 0.5 = 10
        },
        {
            name: 'Takeout: All ratings provided',
            input: {
                visit_type: 'Takeout',
                rating_food: '4', // 8 * 0.5 = 4
                rating_packaging: '5', // 10 * 0.2 = 2
                rating_store_service: '3', // 6 * 0.2 = 1.2
                rating_value: '4' // 8 * 0.1 = 0.8
            },
            expected: '8.0' // 4 + 2 + 1.2 + 0.8 = 8.0
        },
        {
            name: 'Delivery: All ratings provided',
            input: {
                visit_type: 'Delivery',
                rating_food: '3', // 6 * 0.6 = 3.6
                rating_packaging: '4', // 8 * 0.3 = 2.4
                rating_value: '5' // 10 * 0.1 = 1.0
            },
            expected: '7.0' // 3.6 + 2.4 + 1.0 = 7.0
        }
    ];

    let passed = 0;
    testCases.forEach(test => {
        const result = calculateOverallRating(test.input);
        if (result === test.expected) {
            console.log(`✅ ${test.name}: Passed`);
            passed++;
        } else {
            console.error(`❌ ${test.name}: Failed. Expected ${test.expected}, got ${result}`);
        }
    });

    console.log(`\nTests Completed: ${passed}/${testCases.length} passed.`);
};

runTests();
