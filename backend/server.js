
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.json());

app.use(cors());


// Path to data.json
const dataPath = path.join(__dirname, "data.json");


// Helper function to read data
function readData() {
    const data = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(data);
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}


function calculateBalances() {
    const data = readData();
    const members = data.members;
    const expenses = data.expenses;

    const balances = {};

    members.forEach(member => {
        balances[member] = 0;
    });

    expenses.forEach(expense => {
        const splitAmount = Number((expense.amount / members.length).toFixed(2));

        balances[expense.paidBy] += expense.amount;

        members.forEach(member => {
            balances[member] -= splitAmount;
        });
    });

    Object.keys(balances).forEach(member => {
        balances[member] = Number(balances[member].toFixed(2));
    });

    return balances;
}


app.get("/members", (req, res) => {
    const data = readData();
    res.json(data.members);
});


app.post("/members", (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }

    const data = readData();

    // Check duplicate
    const exists = data.members.includes(name);
    if (exists) {
        return res.status(400).json({ message: "Member already exists" });
    }

    data.members.push(name);
    writeData(data);

    res.status(201).json({ message: "Member added successfully", members: data.members });
});

app.get("/expenses", (req, res) => {
    const data = readData();
    res.json(data.expenses);
});


app.post("/expenses", (req, res) => {
    const { paidBy, amount, description } = req.body;

    if (!paidBy || !amount || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const data = readData();

    // Check if member exists
    if (!data.members.includes(paidBy)) {
        return res.status(400).json({ message: "Member does not exist" });
    }

const newExpense = {
    id: Date.now().toString(),  // unique ID
    paidBy,
    amount: Number(amount),
    description,
    date: new Date().toISOString()
};


    data.expenses.push(newExpense);
    data.transactions.push(newExpense);

    writeData(data);

    res.status(201).json({
        message: "Expense added successfully",
        expense: newExpense
    });
});

app.delete("/expenses/:id", (req, res) => {
    const expenseId = req.params.id;
    const data = readData();

    const updatedExpenses = data.expenses.filter(
        expense => expense.id !== expenseId
    );

    data.expenses = updatedExpenses;
    data.transactions = updatedExpenses;

    writeData(data);

    res.json({ message: "Expense deleted successfully" });
});


app.get("/balances", (req, res) => {
    const balances = calculateBalances();
    res.json(balances);
});

app.get("/debts", (req, res) => {
    const balances = calculateBalances();

    const creditors = [];
    const debtors = [];

    Object.keys(balances).forEach(member => {
        if (balances[member] > 0) {
            creditors.push({ name: member, amount: balances[member] });
        } else if (balances[member] < 0) {
            debtors.push({ name: member, amount: -balances[member] });
        }
    });

    const debts = [];

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const minAmount = Math.min(debtor.amount, creditor.amount);

        debts.push({
            from: debtor.name,
            to: creditor.name,
            amount: Number(minAmount.toFixed(2))
        });

        debtor.amount -= minAmount;
        creditor.amount -= minAmount;

        if (debtor.amount === 0) i++;
        if (creditor.amount === 0) j++;
    }

    if (debts.length === 0) {
        return res.json({ message: "All settled up! 🎉" });
    }

    res.json(debts);
});

app.get("/member/:name", (req, res) => {
    const memberName = req.params.name;
    const data = readData();

    if (!data.members.includes(memberName)) {
        return res.status(404).json({ message: "Member not found" });
    }

    // First calculate balances (same logic as /balances)
   const balances = calculateBalances();


    // Now get all debts
    const allDebtsResponse = [];

    const creditors = [];
    const debtors = [];

    Object.keys(balances).forEach(member => {
        if (balances[member] > 0) {
            creditors.push({ name: member, amount: balances[member] });
        } else if (balances[member] < 0) {
            debtors.push({ name: member, amount: -balances[member] });
        }
    });

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const minAmount = Math.min(debtor.amount, creditor.amount);

        allDebtsResponse.push({
            from: debtor.name,
            to: creditor.name,
            amount: Number(minAmount.toFixed(2))
        });

        debtor.amount -= minAmount;
        creditor.amount -= minAmount;

        if (debtor.amount === 0) i++;
        if (creditor.amount === 0) j++;
    }

    // Filter only debts involving this member
    const memberDebts = allDebtsResponse.filter(
        debt => debt.from === memberName || debt.to === memberName
    );

    res.json({
        name: memberName,
        balance: balances[memberName],
        debts: memberDebts
    });
});


app.get("/transactions", (req, res) => {
    const data = readData();
    res.json(data.transactions);
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});