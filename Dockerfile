FROM alpine:latest

WORKDIR /app
COPY . .
RUN apk update
RUN apk add nodejs
#COPY /etc/localtime /etc/localtime
# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN npm install --production
ENV TZ=Europe/Stockholm
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 8000
CMD ["node", "liam.js"]

