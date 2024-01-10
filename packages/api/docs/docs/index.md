# Feature list for git-like API

For testing the commit functionality the following item structure is created:

```   
            h  h        h
      1  2  3  4  5  6  7  8  9 10 11 ...
   1. o--o-----x
   2.       o-----o--x
   3.       o--------x
   4.       o--------x
   5.                   o--o-----l--x
   6.                         o--l-(x)
```

## Features to be implemented

### Git-like item database

- [x] Latest documents can be queried (`GET /items`)
- [x] Latest document by item ID can be queried (`GET /items/:id`)
- [x] Single item can be added (`POST /items`) -> new commit 
- [x] Single item can be changed (`PUT /items/:id`) -> new commit 
- [x] Multiple items can be added (`POST /items/batch`) -> new commit
- [x] All documents of a certain commit can be queried
- [x] Change of unknown item should lead to array
- [x] Specific item can be deleted (`DELETE items/:id`)
- [x] All items can be deleted (`DELETE items/batch`)
- [x] Head can be set to a specific commit (`PATCH items/head/:commit`)

## Diagrams

