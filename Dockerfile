FROM alpine:latest

WORKDIR /app
COPY . .
RUN apk update
RUN apk add nodejs

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN npm install --production

EXPOSE 8000
CMD ["node", "liam.js"]

