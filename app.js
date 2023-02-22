const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initializeDatabaseAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  let queryResponse = null;
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
            SELECT * FROM  todo 
            WHERE status = '${status}';
            `;
        queryResponse = await db.all(getTodosQuery);
        response.send(
          queryResponse.map((eachItem) =>
            convertDbObjectToResponseObject(eachItem)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
              SELECT * FROM todo 
              where priority = '${priority}';
              `;
        queryResponse = await db.all(getTodosQuery);
        response.send(
          queryResponse.map((eachItem) =>
            convertDbObjectToResponseObject(eachItem)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusAndPriorityProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
            SELECT * FROM todo 
            WHERE status = '${status}' AND priority = '${priority}';
            `;
          queryResponse = await db.all(getTodosQuery);
          response.send(
            queryResponse.map((eachItem) =>
              convertDbObjectToResponseObject(eachItem)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%';
          `;

      queryResponse = await db.all(getTodosQuery);
      response.send(
        queryResponse.map((eachItem) =>
          convertDbObjectToResponseObject(eachItem)
        )
      );
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
SELECT * FROM todo 
WHERE category = '${category}' AND status = '${status}';
`;
          queryResponse = await db.all(getTodosQuery);
          response.send(
            queryResponse.map((eachItem) =>
              convertDbObjectToResponseObject(eachItem)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
SELECT * FROM todo 
WHERE category = '${category}';
`;

        queryResponse = await db.all(getTodosQuery);
        response.send(
          queryResponse.map((eachItem) =>
            convertDbObjectToResponseObject(eachItem)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
SELECT * FROM todo
WHERE category='${category}' AND priority='${priority}';
`;

          queryResponse = await db.all(getTodosQuery);
          response.send(
            queryResponse.map((eachItem) =>
              convertDbObjectToResponseObject(eachItem)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      queryResponse = await db.all(getTodosQuery);
      response.send(
        queryResponse.map((eachItem) =>
          convertDbObjectToResponseObject(eachItem)
        )
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
SELECT * FROM todo 
WHERE id = '${todoId}';
`;
  const queryResponse = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(queryResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getTodosQuery = `
    SELECT 
      * 
    FROM 
      todo 
    WHERE 
      due_date = '${newDate}';`;
    const queryResponse = await db.all(getTodosQuery);
    //console.log(responseResult);
    response.send(
      queryResponse.map((eachItem) => convertDbObjectToResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
          INSERT INTO
            todo (id, todo, category,priority, status, due_date)
          VALUES
            (
              ${id}, '${todo}', '${category}','${priority}', '${status}', '${postNewDueDate}'
            );`;
          await db.run(postTodoQuery);
          //console.log(responseResult);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  const previousTodoQuery = `
  SELECT 
    * 
  FROM 
    todo 
  WHERE 
    id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const { todo, priority, status, category, dueDate } = request.body;

  let updateTodoQuery;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
        UPDATE 
          todo 
        SET 
          status = '${status}' 
        WHERE 
          id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
        UPDATE 
          todo 
        SET 
          priority = '${priority}' 
        WHERE 
          id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE 
        todo 
      SET 
        todo = '${todo}' 
      WHERE 
        id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
        UPDATE 
          todo 
        SET 
          category = '${category}'
        WHERE 
          id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
        UPDATE 
          todo 
        SET 
          due_date = '${newDueDate}' 
        WHERE 
          id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
DELETE FROM todo 
WHERE id=${todoId};
`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
