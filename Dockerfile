# Use Node.js 22 for Angular app (compatible with Angular CLI requirements)
FROM node:22-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Angular CLI and dependencies
RUN npm install -g @angular/cli \
    && npm install --force

# Create volume for development (source code will be mounted)
VOLUME ["/usr/src/app"]

# Expose port 4200
EXPOSE 4200

# Run Angular development server with aggressive polling for file changes
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--disable-host-check", "--poll=1000", "--watch"]