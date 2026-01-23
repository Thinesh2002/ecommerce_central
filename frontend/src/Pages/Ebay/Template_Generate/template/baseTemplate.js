export const BASE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Home Style Lighting | Premium Home Decor</title>
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <style>
    /* Resetting default browser styles */
    {{CSS}}
  </style>
</head>
<body>

  <div id="root">
    {{BODY}}
  </div>

  <script>
    console.log("Template Loaded Successfully");
  </script>
</body>
</html>
`;