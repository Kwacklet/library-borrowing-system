// Jenkinsfile - CI/CD pipeline for the Library Borrowing System
// Stages: Checkout -> Test -> Build Images -> Deploy -> Smoke Test
pipeline {
    agent any

    environment {
        // Every image is tagged with the Jenkins build number, e.g. library/books-api:15
        TAG = "${env.BUILD_NUMBER}"
        // How the Jenkins container reaches the app published on your computer
        APP_URL = 'http://host.docker.internal:8080'
    }

    options {
        skipDefaultCheckout()                            // we check out in our own Checkout stage
        disableConcurrentBuilds()                        // one deployment at a time
        buildDiscarder(logRotator(numToKeepStr: '20'))   // keep the last 20 build logs
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Test') {
            steps {
                // Runs Jest inside Docker (the "test" stage of each Dockerfile).
                // If ANY test fails, this step fails and the pipeline STOPS here.
                sh 'docker build --target test ./books-api'
                sh 'docker build --target test ./borrowing-api'
            }
        }

        stage('Build Images') {
            steps {
                // Get the real .env from Jenkins Credentials (never stored in Git)
                withCredentials([file(credentialsId: 'library-env', variable: 'ENV_FILE')]) {
                    sh 'rm -f .env && cp "$ENV_FILE" .env'
                }
                sh 'docker compose build'
                sh 'docker image ls --filter "reference=library/*:${TAG}"'
            }
        }

        stage('Deploy') {
            steps {
                // Replace the running containers with the new images.
                // --wait = wait until every container reports "healthy".
                sh 'docker compose up -d --no-build --wait --wait-timeout 180'
                sh 'docker compose ps'
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    curl -fsS --retry 10 --retry-delay 3 --retry-all-errors "$APP_URL/" > /dev/null
                    curl -fsS "$APP_URL/api/books/health"
                    curl -fsS "$APP_URL/api/borrowings/health"
                    curl -fsS "$APP_URL/api/books" > /dev/null
                    echo "Smoke test passed"
                '''
            }
        }
    }

    post {
        success {
            echo "SUCCESS: Build ${env.BUILD_NUMBER} is deployed. Open http://localhost:8080"
        }
        failure {
            echo "FAILED: Build ${env.BUILD_NUMBER}. If it failed in Test or Build Images, nothing was deployed and the previous version is still running."
        }
        always {
            sh 'rm -f .env'   // do not leave the secret file lying in the workspace
        }
    }
}
