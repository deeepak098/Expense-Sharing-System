import { useState, useEffect } from "react";
import "./App.css";

function App() {

  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [balances, setBalances] = useState({});
const [paidBy, setPaidBy] = useState("");
const [amount, setAmount] = useState("");
const [description, setDescription] = useState("");
const [debts, setDebts] = useState([]);
const [transactions, setTransactions] = useState([]);

useEffect(() => {
  fetchMembers();
  fetchBalances();
  fetchDebts();
  fetchTransactions();
}, []);


  const fetchMembers = () => {
    fetch("http://localhost:5000/members")
      .then(res => res.json())
      .then(data => setMembers(data));
  };

  const fetchBalances = () => {
  fetch("http://localhost:5000/balances")
    .then(res => res.json())
    .then(data => setBalances(data));
};

const fetchDebts = () => {
  fetch("http://localhost:5000/debts")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setDebts(data);
      } else {
        setDebts([]);
      }
    });
};

const fetchTransactions = () => {
  fetch("http://localhost:5000/transactions")
    .then(res => res.json())
    .then(data => setTransactions(data));
};

  const addMember = () => {
    if (!newMember) return;

    fetch("http://localhost:5000/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: newMember })
    })
      .then(res => res.json())
.then(() => {
  setNewMember("");
  fetchMembers();
  fetchBalances();
  fetchDebts();
});

  };

  const addExpense = () => {
  if (!paidBy || !amount || !description) return;

  fetch("http://localhost:5000/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      paidBy,
      amount: Number(amount),
      description
    })
  })
    .then(res => res.json())
    .then(() => {
      setPaidBy("");
      setAmount("");
      setDescription("");
      fetchBalances();
      fetchDebts();
      fetchTransactions();


    });
};

const deleteExpense = (id) => {
  fetch(`http://localhost:5000/expenses/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => {
      fetchBalances();
      fetchDebts();
      fetchTransactions();
    });
};


  return (
  <div className="container">
    <h1>Expense Sharing System</h1>

    <div className="grid">

      {/* LEFT COLUMN */}
      <div>

        <div className="card">
          <h2>Add Member</h2>
          <input
            type="text"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="Enter member name"
          />
          <button onClick={addMember}>Add</button>
        </div>

        <div className="card">
          <h2>Add Expense</h2>

          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Select Member</option>
            {members.map((member, index) => (
              <option key={index} value={member}>
                {member}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button onClick={addExpense}>Add Expense</button>
        </div>

        <div className="card">
          <h2>Transaction History</h2>
          <ul>
            {transactions.map((txn) => (
  <li key={txn.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span>
      {txn.paidBy} paid ₹{txn.amount} for {txn.description}
    </span>
    <button
      style={{ backgroundColor: "#e53935" }}
      onClick={() => deleteExpense(txn.id)}
    >
      Delete
    </button>
  </li>
))}

          </ul>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div>

        <div className="card">
          <h2>Members</h2>
          <ul>
            {members.map((member, index) => (
              <li key={index}>{member}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Balances</h2>
          <ul>
            {Object.entries(balances).map(([name, amount]) => (
              <li
                key={name}
                className={
                  amount > 0
                    ? "balance-positive"
                    : amount < 0
                    ? "balance-negative"
                    : ""
                }
              >
                {name}: ₹{amount}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Debts</h2>
          <ul>
            {debts.length === 0 ? (
              <li>All settled up 🎉</li>
            ) : (
              debts.map((debt, index) => (
                <li key={index}>
                  <span className="debt-from">{debt.from}</span> owes{" "}
                  <span className="debt-to">{debt.to}</span> ₹{debt.amount}
                </li>
              ))
            )}
          </ul>
        </div>

      </div>

    </div>
  </div>
);

}

export default App;