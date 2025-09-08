const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-key-for-jwt-change-me';

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Serve index.html from the root, not a 'public' folder, to match original setup
app.use(express.static(__dirname)); 


// --- MongoDB Connection ---
mongoose.connect('mongodb://localhost:27017/tachyon_db') // Changed DB name for clarity
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);

const SubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: String, required: true },
    problemTitle: { type: String, required: true },
    code: { type: String, required: true },
    points: { type: Number, required: true },
    language: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
});
const Submission = mongoose.model('Submission', SubmissionSchema);


// --- Problem Pool with Multi-Language Initial Code ---
const allProblems = [
    { id: 'two-sum', title: 'Two Sum', points: 25, difficulty: 'Easy', description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>`, examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }], constraints: ['Only one valid answer exists.'], testCases: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 2, 4], 6], expected: [1, 2] }], initialCode: { javascript: `function twoSum(nums, target) {\n  // Your code here\n};`, python: `def twoSum(nums, target):\n  # Your code here\n  pass`, cpp: `#include <vector>\n#include <unordered_map>\n\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // Your code here\n}`, go: `package main\n\nfunc twoSum(nums []int, target int) []int {\n    // Your code here\n\treturn nil\n}`, rust: `pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    // Your code here\n    vec![]\n}` } },
    { id: 'reverse-integer', title: 'Reverse Integer', points: 30, difficulty: 'Medium', description: `<p>Given a signed 32-bit integer, reverse its digits. If reversing causes the value to go outside the signed 32-bit integer range, then return 0.</p>`, examples: [{ input: 'x = 123', output: '321' }, { input: 'x = -123', output: '-321' }], constraints: ['Input is a 32-bit integer.'], testCases: [{ args: [123], expected: 321 }, { args: [-123], expected: -321 }, { args: [120], expected: 21 }], initialCode: { javascript: `function reverse(x) {\n  // Your code here\n};`, python: `def reverse(x):\n  # Your code here\n  pass`, cpp: `#include <limits>\n\nint reverse(int x) {\n    // Your code here\n}`, go: `package main\n\nfunc reverse(x int) int {\n    // Your code here\n\treturn 0\n}`, rust: `pub fn reverse(x: i32) -> i32 {\n    // Your code here\n    0\n}` } },
    { id: 'palindrome-number', title: 'Palindrome Number', points: 20, difficulty: 'Easy', description: `<p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a palindrome, and <code>false</code> otherwise.</p>`, examples: [{ input: 'x = 121', output: 'true' }, { input: 'x = -121', output: 'false' }], constraints: [], testCases: [{ args: [121], expected: true }, { args: [-121], expected: false }, { args: [10], expected: false }], initialCode: { javascript: `function isPalindrome(x) {\n  // Your code here\n};`, python: `def isPalindrome(x):\n  # Your code here\n  pass`, cpp: `bool isPalindrome(int x) {\n    // Your code here\n}`, go: `package main\n\nfunc isPalindrome(x int) bool {\n    // Your code here\n\treturn false\n}`, rust: `pub fn is_palindrome(x: i32) -> bool {\n    // Your code here\n    false\n}` } },
    { id: 'valid-parentheses', title: 'Valid Parentheses', points: 40, difficulty: 'Medium', description: `<p>Given a string <code>s</code> containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.</p>`, examples: [{ input: 's = "()[]{}"', output: 'true' }, { input: 's = "(]"', output: 'false' }], constraints: ['<code>s</code> consists of parentheses only.'], testCases: [{ args: ["()"], expected: true }, { args: ["()[]{}"], expected: true }, { args: ["(]"], expected: false }], initialCode: { javascript: `function isValid(s) {\n  // Your code here\n};`, python: `def isValid(s):\n  # Your code here\n  pass`, cpp: `#include <string>\n#include <stack>\n\nbool isValid(std::string s) {\n    // Your code here\n}`, go: `package main\n\nfunc isValid(s string) bool {\n    // Your code here\n\treturn false\n}`, rust: `pub fn is_valid(s: String) -> bool {\n    // Your code here\n    false\n}` } },
    { id: 'fibonacci-number', title: 'Fibonacci Number', points: 20, difficulty: 'Easy', description: `<p>The Fibonacci numbers, commonly denoted F(n), form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1.</p>`, examples: [{ input: 'n = 4', output: '3' }], constraints: ['0 <= n <= 30'], testCases: [{ args: [2], expected: 1 }, { args: [3], expected: 2 }, { args: [4], expected: 3 }], initialCode: { javascript: `function fib(n) {\n  // Your code here\n};`, python: `def fib(n):\n  # Your code here\n  pass`, cpp: `int fib(int n) {\n    // Your code here\n}`, go: `package main\n\nfunc fib(n int) int {\n    // Your code here\n\treturn 0\n}`, rust: `pub fn fib(n: i32) -> i32 {\n    // Your code here\n    0\n}` } },
    { id: 'max-profit', title: 'Best Time to Buy and Sell Stock', points: 45, difficulty: 'Medium', description: `<p>You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i</code>th day. Find the maximum profit you can achieve by buying on one day and selling on a future day.</p>`, examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5' }], constraints: [], testCases: [{ args: [[7, 1, 5, 3, 6, 4]], expected: 5 }, { args: [[7, 6, 4, 3, 1]], expected: 0 }], initialCode: { javascript: `function maxProfit(prices) {\n  // Your code here\n};`, python: `def maxProfit(prices):\n  # Your code here\n  pass`, cpp: `#include <vector>\n#include <algorithm>\n\nint maxProfit(std::vector<int>& prices) {\n    // Your code here\n}`, go: `package main\n\nfunc maxProfit(prices []int) int {\n    // Your code here\n\treturn 0\n}`, rust: `pub fn max_profit(prices: Vec<i32>) -> i32 {\n    // Your code here\n    0\n}` } },
    { id: 'fizz-buzz', title: 'Fizz Buzz', points: 15, difficulty: 'Easy', description: `<p>Given an integer <code>n</code>, return a string array where the item at index <code>i</code> is "FizzBuzz" if <code>i</code> is divisible by 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, or the number <code>i</code> as a string otherwise.</p>`, examples: [{ input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' }], constraints: ['1-indexed for logic, 0-indexed for array.'], testCases: [{ args: [3], expected: ["1", "2", "Fizz"] }, { args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] }], initialCode: { javascript: `function fizzBuzz(n) {\n  // Your code here\n};`, python: `def fizzBuzz(n):\n  # Your code here\n  pass`, cpp: `#include <vector>\n#include <string>\n\nstd::vector<std::string> fizzBuzz(int n) {\n    // Your code here\n}`, go: `package main\n\nfunc fizzBuzz(n int) []string {\n    // Your code here\n\treturn nil\n}`, rust: `pub fn fizz_buzz(n: i32) -> Vec<String> {\n    // Your code here\n    vec![]\n}` } },
    { id: 'valid-anagram', title: 'Valid Anagram', points: 30, difficulty: 'Easy', description: `<p>Given two strings <code>s</code> and <code>t</code>, return <code>true</code> if <code>t</code> is an anagram of <code>s</code>, and <code>false</code> otherwise.</p>`, examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true' }], constraints: [], testCases: [{ args: ["anagram", "nagaram"], expected: true }, { args: ["rat", "car"], expected: false }], initialCode: { javascript: `function isAnagram(s, t) {\n  // Your code here\n};`, python: `def isAnagram(s, t):\n  # Your code here\n  pass`, cpp: `#include <string>\n#include <unordered_map>\n\nbool isAnagram(std::string s, std::string t) {\n    // Your code here\n}`, go: `package main\n\nfunc isAnagram(s string, t string) bool {\n    // Your code here\n\treturn false\n}`, rust: `pub fn is_anagram(s: String, t: String) -> bool {\n    // Your code here\n    false\n}` } },
    { id: 'max-subarray', title: 'Maximum Subarray', points: 50, difficulty: 'Medium', description: `<p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.</p>`, examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' }], constraints: [], testCases: [{ args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }, { args: [[5, 4, -1, 7, 8]], expected: 23 }], initialCode: { javascript: `function maxSubArray(nums) {\n  // Your code here\n};`, python: `def maxSubArray(nums):\n  # Your code here\n  pass`, cpp: `#include <vector>\n#include <algorithm>\n\nint maxSubArray(std::vector<int>& nums) {\n    // Your code here\n}`, go: `package main\n\nfunc maxSubArray(nums []int) int {\n    // Your code here\n\treturn 0\n}`, rust: `pub fn max_sub_array(nums: Vec<i32>) -> i32 {\n    // Your code here\n    0\n}` } },
    { id: 'contains-duplicate', title: 'Contains Duplicate', points: 20, difficulty: 'Easy', description: `<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears at least twice in the array, and return <code>false</code> if every element is distinct.</p>`, examples: [{ input: 'nums = [1,2,3,1]', output: 'true' }], constraints: [], testCases: [{ args: [[1, 2, 3, 1]], expected: true }, { args: [[1, 2, 3, 4]], expected: false }], initialCode: { javascript: `function containsDuplicate(nums) {\n  // Your code here\n};`, python: `def containsDuplicate(nums):\n  # Your code here\n  pass`, cpp: `#include <vector>\n#include <unordered_set>\n\nbool containsDuplicate(std::vector<int>& nums) {\n    // Your code here\n}`, go: `package main\n\nfunc containsDuplicate(nums []int) bool {\n    // Your code here\n\treturn false\n}`, rust: `use std::collections::HashSet;\n\npub fn contains_duplicate(nums: Vec<i32>) -> bool {\n    // Your code here\n    false\n}` } },
    { id: 'climbing-stairs', title: 'Climbing Stairs', points: 35, difficulty: 'Medium', description: `<p>You are climbing a staircase. It takes <code>n</code> steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?</p>`, examples: [{ input: 'n = 3', output: '3' }], constraints: ['1 <= n <= 45'], testCases: [{ args: [2], expected: 2 }, { args: [3], expected: 3 }, { args: [5], expected: 8 }], initialCode: { javascript: `function climbStairs(n) {\n  // Your code here\n};`, python: `def climbStairs(n):\n  # Your code here\n  pass`, cpp: `int climbStairs(int n) {\n    // Your code here\n}`, go: `package main\n\nfunc climbStairs(n int) int {\n    // Your code here\n\treturn 0\n}`, rust: `pub fn climb_stairs(n: i32) -> i32 {\n    // Your code here\n    0\n}` } }
];

// --- Middleware to verify token ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// --- API Routes ---

// Authentication
app.post('/api/auth/signup', async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please enter all fields.' });
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User with this email already exists.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ name, email, password: hashedPassword });
        await user.save();
        const payload = { user: { id: user.id, name: user.name, email: user.email } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
        res.status(201).json({ token, user: payload.user });
    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

app.post('/api/auth/signin', async (req, res) => {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.trim().toLowerCase() : undefined;
    if (!email || !password) return res.status(400).json({ message: 'Please enter all fields.' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
        const payload = { user: { id: user.id, name: user.name, email: user.email } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
        res.status(200).json({ token, user: payload.user });
    } catch (err) {
        console.error("Signin Error:", err.message);
        res.status(500).json({ message: 'Server error during signin.' });
    }
});

// Problems
app.get('/api/problems', authMiddleware, (req, res) => {
    const shuffled = [...allProblems].sort(() => 0.5 - Math.random());
    const selectedProblems = shuffled.slice(0, 3);
    res.json(selectedProblems);
});

// Submissions
app.post('/api/submissions', authMiddleware, async (req, res) => {
    const { problemId, problemTitle, code, points, language } = req.body;
    try {
        const newSubmission = new Submission({ userId: req.user.id, problemId, problemTitle, code, points, language });
        await newSubmission.save();
        res.status(201).json({ message: 'Submission saved successfully.' });
    } catch (err) {
        console.error("Submission Save Error:", err.message);
        res.status(500).json({ message: 'Server error while saving submission.' });
    }
});

// --- Code Execution Helpers ---
const getExecutionWrapper = (language, userCode) => {
    if (language === 'javascript') {
        return `${userCode}\n\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });\nrl.on('line', function(line){\n    const args = JSON.parse(line);\n    const funcName = Object.keys(this).find(k => typeof this[k] === 'function');\n    const result = global[funcName](...args);\n    console.log(JSON.stringify(result));\n}.bind(global));`;
    }
    if (language === 'python') {
        const functionName = userCode.match(/def\s+(\w+)\s*\(/)[1];
        return `import sys\nimport json\n\n${userCode}\n\nfor line in sys.stdin:\n  args = json.loads(line)\n  result = ${functionName}(*args)\n  print(json.dumps(result))`;
    }
    // For compiled languages, the user code is sufficient as Judge0 handles main function wrapping.
    return userCode;
}

// Code Execution
app.post('/api/execute', authMiddleware, async (req, res) => {
    const { language, code, testCases, problemId } = req.body;
    
    // Find the problem to get function name and other details if needed
    const problem = allProblems.find(p => p.id === problemId);
    if (!problem) {
        return res.status(404).json({ message: "Problem not found." });
    }

    const languageIdMap = { javascript: 93, python: 92, cpp: 54, go: 95, rust: 94 };
    const language_id = languageIdMap[language];
    if (!language_id) return res.status(400).json({ message: "Unsupported language." });

    try {
        const resultsPromises = testCases.map(async (testCase, index) => {
            // For JS and Python, wrap the code to handle stdin/stdout.
            // For C++, Go, Rust etc., Judge0 often expects a full program, but the initial templates should guide the user. 
            // Here, we'll keep it simpler by just sending the code and letting Judge0 handle it.
            // A more advanced system would create a main function dynamically.
            const source_code = Buffer.from(code).toString('base64');
            const stdin = JSON.stringify(testCase.args); // Pass arguments as a single JSON line
            
            const options = {
                method: 'POST',
                url: `https://${process.env.RAPIDAPI_HOST}/submissions`,
                params: { base64_encoded: 'true', fields: '*' },
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
                },
                data: { language_id, source_code, stdin: Buffer.from(stdin).toString('base64') },
            };

            const submissionResponse = await axios.request(options);
            const token = submissionResponse.data.token;
            
            // Polling for results
            while (true) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const resultOptions = {
                    method: 'GET',
                    url: `https://${process.env.RAPIDAPI_HOST}/submissions/${token}`,
                    params: { base64_encoded: 'true', fields: '*' },
                    headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY, 'X-RapidAPI-Host': process.env.RAPIDAPI_HOST },
                };
                const resultResponse = await axios.request(resultOptions);
                const statusId = resultResponse.data.status.id;
                
                if (statusId > 2) { // Statuses 1 (In Queue) and 2 (Processing) mean we wait
                    const stdout = resultResponse.data.stdout ? Buffer.from(resultResponse.data.stdout, 'base64').toString('utf-8').trim() : null;
                    const stderr = resultResponse.data.stderr ? Buffer.from(resultResponse.data.stderr, 'base64').toString('utf-8') : null;
                    let actual;
                    try { 
                        actual = JSON.parse(stdout); 
                    } catch (e) {
                         // Handle non-JSON output (e.g. plain numbers, strings)
                         if (stdout === 'true') actual = true;
                         else if (stdout === 'false') actual = false;
                         else actual = isNaN(Number(stdout)) || stdout === '' ? stdout : Number(stdout);
                    }
                    return { index, status: resultResponse.data.status.description, actual, error: stderr, ...testCase };
                }
            }
        });
        const results = await Promise.all(resultsPromises);
        res.json(results);
    } catch (error) {
        console.error("Execution Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "An error occurred during code execution." });
    }
});


// --- Serve Frontend ---
// This catch-all route ensures that any request not matching an API endpoint serves the frontend.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});