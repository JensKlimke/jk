# Project Guidelines

## Project Overview
This repository contains a collection of microservices and applications, including the "whoami" service which provides information about the server environment and incoming HTTP requests. The project follows a structured approach to documentation and implementation, with a focus on maintaining consistency between specifications and code. The guideline focusses mainly on the packages in the project containing a specification (docs folder) with the L0-L3 specification documents.

## Documentation Structure
The project uses a three-level documentation approach for each service:

1. **Level 0: Problem Requirement Description (PRD)** - High-level requirements and problem statements
2. **Level 1: Technical Architecture** - System design, component architecture, and technical decisions
3. **Level 2: Implementation Tasks & Detailed Design** - Detailed implementation tasks and component designs

## Feature Specification Guidelines

### Top-Down Approach (New Features)
When adding a new feature that hasn't been implemented yet, follow this process:

1. **Specify (L0-L3)**:
   - Update Level 0 (PRD) with new requirements
   - Update Level 1 (Architecture) with design changes
   - Update Level 2 (Implementation) with detailed tasks
2. **Implement** the feature according to the specifications
3. **Write tests** to verify the implementation
4. **Execute tests** to ensure correctness
5. **Modify implementation** when necessary to meet the specification
6. **Update specification L2 → L1 → L0** if necessary, to ensure consistency. 


### Bottom-Up Approach (Existing Implementation)
When code has been added without prior specification, follow this process:

1. **Implement** the feature in the code
2. **Write tests** to verify the implementation
3. **Execute tests** to ensure correctness
4. **Specify (L0-L3)**:
   - Update Level 0 (PRD) with new requirements
   - Update Level 1 (Architecture) with design changes
   - Update Level 2 (Implementation) with detailed tasks
5. **Check consistency** between implementation and specifications

## Specification Maintenance Guidelines

1. **Keep specifications lean**:
   - Include only what is currently implemented
   - Avoid specifying future features not yet implemented
   - Remove outdated specifications

2. **Ensure consistency**:
   - Maintain traceability between all three levels
   - Use consistent identifiers across documents (e.g., REQ-1, ARCH-1, IMPL-1)
   - Verify that implementation matches specifications

3. **Use proper referencing**:
   - Make elements referenceable with unique identifiers
   - Create upstream references between documents
   - Maintain a traceability matrix in Level 2 documentation
