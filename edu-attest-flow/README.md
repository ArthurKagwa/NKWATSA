# NKWATSA AI - Web3 Education Platform

A minimal but functional NKWATSA AI web app that uses Sign In with Ethereum (SIWE) for login, role-based access control, tool calling for assessments, and persistent progress with a clean dashboard.

## Features

- **Wallet Authentication**: SIWE with MetaMask integration and secure session management
- **Role-Based Access Control**: Learner, Tutor, Benefits Admin, System, and Platform Admin roles
- **Timed Assessments**: Readiness quiz with multiples of two questions (8/10 passing within 180 seconds)
- **Progress Tracking**: Persistent attempts and progress stored in Supabase Postgres database
- **Verifiable Achievements**: SHA256 proof generation with EAS attestation and ERC-5192 badge stubs
- **Benefits Gate**: One-time claim codes issued when readiness checkpoint is met
- **Clean Dashboard**: Achievement tracking and course progress visualization

## Technology Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Web3**: Wagmi + Viem for wallet connection and signing
- **Authentication**: Spruce SIWE for message creation and verification
- **Database**: Supabase Postgres (hosted via Supabase)
- **UI Components**: shadcn/ui components with custom design system

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd nkwatsa-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Demo Accounts

The app includes seeded demo accounts with different roles:

- **Learner**: `0x742d35Cc64C0532A79C2eeAa86844C2F4F0d8d1A`
- **Tutor**: `0x8ba1f109551bD432803012645Hac136c22C9C9e8`
- **Benefits Admin**: `0xaBBa3d9f51aab6f908f6362e58C244518d9ae42D`
- **System**: `0x1234567890123456789012345678901234567890`
- **Platform Admin**: `0x0987654321098765432109876543210987654321`

## Usage

### For Learners

1. **Connect Wallet**: Use MetaMask to connect and sign the SIWE message
2. **Take Quiz**: Navigate to "Start Quiz" to begin the readiness assessment
3. **View Progress**: Check your dashboard for achievements and progress
4. **Claim Benefits**: Access the benefits portal once you pass the readiness checkpoint

### For Tutors

1. **Create Courses**: Register new courses with modules and checkpoints
2. **Manage Checkpoints**: Configure passing rules and requirements
3. **View Analytics**: Monitor student progress and performance

### For Benefits Admins

1. **Validate Proofs**: Verify achievement attestations
2. **Issue Claim Codes**: Generate benefit claim codes for eligible learners
3. **Track Redemptions**: Monitor benefit usage and claims

## API Endpoints

The app includes tool calling endpoints with idempotency:

- `POST /api/tools/register_course` - Register courses (Tutor, Platform Admin)
- `POST /api/tools/generate_quiz` - Generate quizzes (System, Tutor, Platform Admin)
- `POST /api/tools/score_attempt` - Score quiz attempts (Learner, System, Tutor, Platform Admin)
- `POST /api/tools/update_progress` - Update learner progress (Learner, System, Platform Admin)
- `POST /api/tools/issue_attestation` - Issue achievement attestations (System, Tutor, Platform Admin)
- `POST /api/tools/mint_badge_sbt` - Mint SBT badges (stub) (System, Tutor, Platform Admin)
- `POST /api/tools/grant_benefit` - Grant benefits (Benefits Admin, System, Platform Admin)

All endpoints require:
- Valid SIWE session
- Appropriate role permissions
- `X-Request-Id` header for idempotency

## Database Schema

The app uses Supabase Postgres with the following main tables:

- **users**: Wallet addresses and profile information
- **user_roles**: Role assignments for RBAC
- **courses**: Course definitions and metadata
- **modules**: Course modules with passing rules
- **attempts**: Quiz attempt records with scores
- **progress**: Learner progress tracking
- **benefit_claims**: Benefit claim codes and redemptions

## Security Features

- **Nonce Verification**: Fresh nonces for each SIWE message
- **Domain Validation**: Ensures messages are for the correct domain
- **Role-Based Access**: Endpoint protection based on user roles
- **Idempotency**: Prevents duplicate operations with request IDs
- **Session Management**: Secure session tokens with expiration

## Future Enhancements

- EAS attestation integration (currently stubbed)
- ERC-5192 Soul Bound Token minting (currently stubbed)
- Advanced proctoring features
- LRS integration
- Multi-chain support

## License

MIT
