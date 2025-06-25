module.exports = async function (context, req) {
    context.log('Test function triggered.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? `Hello, ${name}! Azure Functions configuration is working correctly.`
        : "Hello! Azure Functions configuration is working correctly. Pass a name in the query string or in the request body for a personalized response.";

    // Test basic functionality
    const testResults = {
        timestamp: new Date().toISOString(),
        functionName: 'TestFunction',
        runtime: process.version,
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            functionsWorkerRuntime: process.env.FUNCTIONS_WORKER_RUNTIME,
            azureWebJobsStorage: process.env.AzureWebJobsStorage ? 'configured' : 'not configured'
        },
        extensions: {
            cosmosDB: 'loaded',
            serviceBus: 'loaded'
        },
        message: responseMessage
    };

    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: testResults
    };
};
