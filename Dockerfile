# Use an ARM-compatible Node.js image
FROM node:20-buster-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# # Copy the self-signed certificate and key
# COPY key.pem ./
# COPY cert.pem ./

# Install Angular CLI and dependencies
RUN npm install -g @angular/cli \
    && npm install --force

# Expose port 5555
EXPOSE 4200

# Run Angular development server with SSL
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--disableHostCheck"]
#  "--ssl", "--ssl-key", "key.pem", "--ssl-cert", "cert.pem", "--disableHostCheck"