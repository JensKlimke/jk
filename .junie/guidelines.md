# Project Guidelines

## Project Overview
This repository contains a collection of microservices and applications, including the "whoami" service which provides information about the server environment and incoming HTTP requests. The project follows a structured approach to documentation and implementation, with a focus on maintaining consistency between specifications and code. The guideline focuses mainly on the packages in the project containing a specification (docs folder) with the L0-L3 specification documents.

## Specification Concept
The "specification concept" is a structured approach to documenting and implementing features in a way that ensures consistency, traceability, and maintainability. It involves creating a hierarchical set of specification documents that describe a feature from high-level requirements down to detailed implementation tasks, and then implementing the code according to these specifications.

## Documentation Structure
The project uses a three-level documentation approach for each service:

1. **Level 0: Problem Requirement Description (PRD)** - High-level requirements and problem statements
   - Defines WHAT the service should do and WHY
   - Uses identifiers like PRD-1, PRD-2, etc.
   - Example: `PRD-3.1: Server Information` describes what server information users need to view

2. **Level 1: Technical Architecture** - System design, component architecture, and technical decisions
   - Defines HOW the service will be structured at a high level
   - Uses identifiers like ARCH-1, ARCH-2, etc.
   - References back to Level 0 requirements (e.g., COMP-3 references PRD-3.1)
   - Example: `ARCH-2.1: Core Components` lists all components with their purposes and references to requirements

3. **Level 2: Implementation Tasks & Detailed Design** - Detailed implementation tasks and component designs
   - Defines HOW to implement each component in detail
   - Uses identifiers like IMPL-1, TASK-1.1.1, etc.
   - References back to Level 1 components (e.g., IMPL-1.3 references COMP-3)
   - Includes code snippets, file paths, and task completion status
   - Example: `IMPL-1.3: Whoami Service (COMP-3)` details the implementation of the Whoami Service component

## Feature Specification Guidelines

### Top-Down Approach (New Features)
When adding a new feature that hasn't been implemented yet, follow this process:

1. **Specify (L0-L3)**:
   - Update Level 0 (PRD) with new requirements
     - Define the problem and user requirements
     - Assign unique identifiers (PRD-X.Y)
   - Update Level 1 (Architecture) with design changes
     - Define components and their interactions
     - Reference Level 0 requirements
     - Assign unique identifiers (ARCH-X.Y)
   - Update Level 2 (Implementation) with detailed tasks
     - Define implementation tasks for each component
     - Include file paths and code snippets
     - Reference Level 1 components
     - Assign unique identifiers (IMPL-X.Y, TASK-X.Y.Z)
2. **Implement** the feature according to the specifications
   - Follow the file structure and code design from Level 2
   - Implement each task as specified
3. **Write tests** to verify the implementation
   - Ensure tests cover all requirements from Level 0
4. **Execute tests** to ensure correctness
   - Mark tasks as completed (✓) in Level 2 when tests pass
5. **Modify implementation** when necessary to meet the specification
   - Update code to address any issues found during testing
6. **Update specification L2 → L1 → L0** if necessary, to ensure consistency
   - If implementation details change, update Level 2 first
   - If architectural changes are needed, update Level 1
   - If requirements change, update Level 0

### Bottom-Up Approach (Existing Implementation)
When code has been added without prior specification, follow this process:

1. **Implement** the feature in the code
2. **Write tests** to verify the implementation
3. **Execute tests** to ensure correctness
4. **Specify (L0-L3)**:
   - Update Level 0 (PRD) with new requirements
     - Extract the problem and user requirements from the implementation
     - Assign unique identifiers (PRD-X.Y)
   - Update Level 1 (Architecture) with design changes
     - Document the components and their interactions
     - Reference Level 0 requirements
     - Assign unique identifiers (ARCH-X.Y)
   - Update Level 2 (Implementation) with detailed tasks
     - Document the implementation tasks for each component
     - Include file paths and code snippets
     - Reference Level 1 components
     - Assign unique identifiers (IMPL-X.Y, TASK-X.Y.Z)
     - Mark all tasks as completed (✓)
5. **Check consistency** between implementation and specifications
   - Ensure the specifications accurately reflect the implementation
   - Update specifications if discrepancies are found

## Specification Maintenance Guidelines

1. **Keep specifications lean**:
   - Include only what is currently implemented
   - Avoid specifying future features not yet implemented
   - Remove outdated specifications

2. **Ensure consistency**:
   - Maintain traceability between all three levels
   - Use consistent identifiers across documents (e.g., PRD-1, ARCH-1, IMPL-1)
   - Verify that implementation matches specifications

3. **Use proper referencing**:
   - Make elements referenceable with unique identifiers
   - Create upstream references between documents (e.g., COMP-3 references PRD-3.1)
   - Maintain a traceability matrix in Level 2 documentation

## Example Specification Structure
Here's an example of how the three levels of specification relate to each other:

### Level 0 (PRD) Example:
```markdown
## PRD-3.1: Server Information
Users need to view basic information about the server handling their request, including:
- Hostname of the server
- IP addresses of the server
- A persistent unique identifier for the application instance
```

### Level 1 (Architecture) Example:
```markdown
| Component ID | Component Name | Description | References |
|--------------|----------------|-------------|------------|
| COMP-3 | Whoami Service | Provides server and request information | PRD-3.1, PRD-3.2 |
```

### Level 2 (Implementation) Example:
```markdown
### IMPL-1.3: Whoami Service (COMP-3)
**File**: `src/services/whoami.service.ts`

**Description**: Provides information about the server and the request.

**Implementation Tasks**:
- TASK-1.3.1: Implement main information retrieval method ✓
- TASK-1.3.2: Implement hostname retrieval ✓
- TASK-1.3.3: Implement IP addresses retrieval ✓

**Design Details**:
```typescript
export class WhoamiService {
  // Main method to get all information
  getWhoamiInfo(req: Request, apiId: string): WhoamiInfo { ... }

  // Get hostname
  private getHostname(): string { ... }
}
```

