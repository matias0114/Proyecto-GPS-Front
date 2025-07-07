pipeline {
  agent {
    docker {
      image 'docker:24-dind'
      args  '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    IMAGE_NAME   = "matiasjara1901244/proyectogps-frontend"
    SSH_CRED     = 'ssh-prod'
    REMOTE_USER  = 'matiasjara1901'
    REMOTE_HOST  = '190.13.177.173'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build & Push') {
      steps {
        dir('frontend') {
          // construye la imagen usando el Dockerfile de /frontend
          sh "docker build -t ${IMAGE_NAME}:latest ."
        }
        // logueo y push a Docker Hub
        withCredentials([usernamePassword(
          credentialsId: 'docker-hub-creds',
          usernameVariable: 'DOCKERHUB_USER',
          passwordVariable: 'DOCKERHUB_PASS'
        )]) {
          sh '''
            echo "$DOCKERHUB_PASS" | docker login --username "$DOCKERHUB_USER" --password-stdin
            docker push ${IMAGE_NAME}:latest
          '''
        }
      }
    }

    stage('Deploy simple') {
      steps {
        sshagent([SSH_CRED]) {
          sh """
            ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '\\
              docker pull ${IMAGE_NAME}:latest && \\
              docker stop gps-frontend || true && \\
              docker rm   gps-frontend || true && \\
              docker run -d \\
                --name       gps-frontend \\
                --restart    always \\
                -p 8005:80 \\
                -e API_BASE_URL=http://190.13.177.173:8080 \\
                ${IMAGE_NAME}:latest'
          """
        }
      }
    }
  }

  post {
    success { echo '✅ Despliegue completado correctamente' }
    failure { echo '❌ Hubo un error en el pipeline' }
  }
}