# M3 Music CI Setup

This repository uses GitHub Actions for CI, security scans, Docker image builds, and ECR publishing. It does not deploy to Kubernetes.

## GitHub Variables

Create these repository or organization variables:

- `AWS_REGION`: AWS region for ECR, for example `ap-south-1`.
- `AWS_ACCOUNT_ID`: AWS account ID that owns the ECR repositories.
- `ECR_BACKEND_REPOSITORY`: existing backend ECR repository name.
- `ECR_FRONTEND_REPOSITORY`: existing frontend ECR repository name.
- `SONAR_PROJECT_KEY`: SonarCloud project key.
- `SONAR_ORGANIZATION`: SonarCloud organization key.

## GitHub Secrets

Create these repository or organization secrets:

- `AWS_GITHUB_ACTIONS_ROLE_ARN`: IAM role ARN assumed by GitHub Actions through OIDC.
- `SONAR_TOKEN`: SonarCloud token.
- `SNYK_TOKEN`: Snyk API token.

Do not use long-lived AWS access keys for this workflow.

## AWS GitHub OIDC Provider

Create an IAM OIDC identity provider:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

## IAM Trust Policy

Replace `<AWS_ACCOUNT_ID>`, `<GITHUB_ORG>`, and `<REPO_NAME>` with your real values.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:<GITHUB_ORG>/<REPO_NAME>:ref:refs/heads/master",
            "repo:<GITHUB_ORG>/<REPO_NAME>:ref:refs/tags/v*.*.*"
          ]
        }
      }
    }
  ]
}
```

## Required ECR Permissions

Attach an IAM policy to the GitHub Actions role that allows image publishing to the existing backend and frontend ECR repositories.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:DescribeRepositories",
        "ecr:BatchGetImage"
      ],
      "Resource": [
        "arn:aws:ecr:<AWS_REGION>:<AWS_ACCOUNT_ID>:repository/<ECR_BACKEND_REPOSITORY>",
        "arn:aws:ecr:<AWS_REGION>:<AWS_ACCOUNT_ID>:repository/<ECR_FRONTEND_REPOSITORY>"
      ]
    }
  ]
}
```

The workflow assumes the ECR repositories already exist.

## Image Tagging

Semantic version tag pushes publish the same semantic tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Published images:

```text
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<ECR_BACKEND_REPOSITORY>:v1.0.0
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<ECR_FRONTEND_REPOSITORY>:v1.0.0
```

Supported tag formats:

- `v1.0.0`
- `v1.2.3`
- `v1.2.3-rc.1`

Pushes to `master` publish `latest`. Pull requests build local images only and do not push to ECR.

## SonarCloud Setup

1. Create or sign in to a SonarCloud account.
2. Import the GitHub repository.
3. Copy the SonarCloud project key into `SONAR_PROJECT_KEY`.
4. Copy the organization key into `SONAR_ORGANIZATION`.
5. Generate a token in SonarCloud.
6. Store the token as the GitHub secret `SONAR_TOKEN`.

The workflow scans `backend/src` and `frontend/src` as one repository-level project.

## Snyk Setup

1. Create or sign in to a Snyk account.
2. Generate an API token.
3. Store it as the GitHub secret `SNYK_TOKEN`.

The workflow runs:

```bash
snyk test --file=backend/package.json --severity-threshold=high
snyk test --file=frontend/package.json --severity-threshold=high
```

Directories without a `package.json` are skipped.

## Trivy Behavior

The workflow scans the built backend and frontend Docker images with Trivy:

- Output format: table
- Fails on: `HIGH` and `CRITICAL`
- Ignores unfixed vulnerabilities

No token is required for scanning the local images built during the workflow. If you later scan private ECR images directly by reference, authenticate to ECR first with `aws-actions/amazon-ecr-login`.

## Local Validation Commands

From the repository root:

```bash
cd frontend
npm ci
npm run lint --if-present
npm test --if-present
npm run build
```

```bash
cd backend
npm ci
npm run lint --if-present
npm test --if-present
```

```bash
docker build -t m3music-backend:local backend
docker build -t m3music-frontend:local frontend
```

