const secret = process.env.ADMIN_SECRET;
console.log("ADMIN_SECRET:", JSON.stringify(secret));
console.log("Type:", typeof secret);
console.log("Length:", secret ? secret.length : "undefined");
console.log("Chars:", secret ? [...secret].map(c => c.charCodeAt(0)) : "n/a");
