// See https://github.com/typicode/json-server#module
const jsonServer = require('json-server');

const server = jsonServer.create();

const express = require('express');

// Uncomment to allow write operations
const fs = require('fs');
const path = require('path');
const filePath = path.join('db.json');
const data = fs.readFileSync(filePath, 'utf-8');
const db = JSON.parse(data);
const router = jsonServer.router(db);

// Comment out to allow write operations
// const router = jsonServer.router('db.json');

const middlewares = jsonServer.defaults();

server.use('/public', express.static(path.join(__dirname, '..', 'public')));

server.use(middlewares);
// Add this before server.use(router)
// server.use(
//     jsonServer.rewriter({
//         '/api/*': '/$1',
//         '/blog/:resource/:id/show': '/:resource/:id',
//     }),
// );

// Custom middleware to handle OR queries with gender filtering
server.use((req, res, next) => {
    if (req.method === 'GET') {
        // Determine the gender based on query parameters
        const gender = req.query.women ? 'women' : req.query.men ? 'men' : req.query.children ? 'children' : null;

        // Remove gender from query to avoid conflict with other filters
        delete req.query.women;
        delete req.query.men;
        delete req.query.children;

        // OR query handling
        if (gender && req.query.or) {
            const orConditions = req.query.or.split(','); // Expect something like 'description=heels,productName=heels'

            const results = db.products.filter(item => {
                return (
                    item.gender === gender && // Filter by gender first
                    orConditions.some(condition => {
                        const [key, value] = condition.split('=');
                        return item[key] && item[key].toLowerCase().includes(value.toLowerCase());
                    })
                );
            });

            return res.jsonp(results); // Return the filtered results
        } else if (gender) {
            // Handle standard gender filtering with other query parameters
            let results = db.products.filter(item => item.gender === gender);

            // Apply other query filters like description_like
            for (let key in req.query) {
                const value = req.query[key];
                if (key.endsWith('_like')) {
                    const realKey = key.replace('_like', '');
                    results = results.filter(
                        item => item[realKey] && item[realKey].toLowerCase().includes(value.toLowerCase()),
                    );
                }
            }

            return res.jsonp(results);
        }
    }

    next();
});

server.use(router);
server.listen(3000, () => {
    console.log('JSON Server is running');
});

// Export the Server API
module.exports = server;
