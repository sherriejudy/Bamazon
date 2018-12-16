var mysql = require("mysql");
var inquirer = require("inquirer");
var table = require("table").table;
// Make database connection
var connection = mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "password"
});

connection.connect();

var questions = [
  {
    type: "input",
    name: "id",
    message: "Enter the ID of the product you want to buy.",
    validate: function(value) {
      var pass = /^\+?(0|[1-9]\d*)$/.test(value);

      if (pass) {
        return true;
      }
      return "Please enter a valid ID (integer).";
    }
  },
  {
    type: "input",
    name: "amount",
    message: "How many do you want to buy?",
    validate: function(value) {
      var pass = /^\+?(0|[1-9]\d*)$/.test(value);

      if (pass) {
        return true;
      }
      return "Please enter a valid amount (integer).";
    }
  }
];

// Unwraps the list of mysql objects
function unwrap(results) {
  return results.map(item => {
    return {
      item_id: item.item_id,
      product_name: item.product_name,
      department_name: item.department_name,
      price: item.price,
      stock_quantity: item.stock_quantity
    };
  });
}

// Displays a table view
function display(results) {
  var unwrapped = unwrap(results);
  var array = unwrapped.map(item => {
    return [item.item_id, item.product_name, item.price, item.stock_quantity];
  });
  array.unshift(["Item ID", "Product Name", "Price", "Quantity"]);
  console.log(table(array));
}

// Place an order
function placeOrder(id, amount) {
  if (amount < 0) {
    console.log("Invalid amount!");
  }
  connection.query(
    "select * from bamazon.products where item_id = " + id,
    function(error, results, fields) {
      if (error) {
        console.log("Something went wrong.");
        connection.end();
        return;
      }
      var unwrapped = unwrap(results);

      if (unwrapped.length != 1) {
        console.log("Couldn't find the item...");
        connection.end();
        return;
      }
      var item = unwrapped[0];

      // Check if the quantity is valid
      if (amount > item.stock_quantity) {
        console.log("Insufficient quantity!");
        connection.end();
        return;
      }

      // Update database
      var newQuantity = item.stock_quantity - amount;
      connection.query(
        "update bamazon.products set stock_quantity=" +
          newQuantity +
          " where item_id=" +
          id,
        function(error, results, fields) {
          if (error) {
            console.log("Something went wrong with the update...Aborting.");
            connection.end();
            return;
          }

          // Quantity is valid and the item exists, do the purchase
          var cost = item.price * amount;
          console.log("The total price: $" + cost);
          connection.end();
        }
      );
    }
  );
}

// Shows prompt
function start() {
  connection.query("select * from bamazon.products", function(
    error,
    results,
    fields
  ) {
    if (error) throw error;
    display(results);
    // Show prompts
    inquirer.prompt(questions).then(answers => {
      placeOrder(answers.id, answers.amount);
    });
  });
}

start();
