## Build

Run from the project directory:
`docker build -t hw1-web:1.0 .`


## Start

`docker run -d --name hw1-container -p 127.0.0.1:8080:5000 -e MESSAGE="Hello Docker" hw1-web:1.0`

Open http://localhost:8080 in your browser.

`MESSAGE` sets the response message. Local port `8080` maps to container port `5000`
