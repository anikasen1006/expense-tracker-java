FROM maven:3.9.6-eclipse-temurin-17

WORKDIR /app

COPY . .

RUN cd backend && mvn clean package

CMD ["java", "-jar", "backend/target/*.jar"]