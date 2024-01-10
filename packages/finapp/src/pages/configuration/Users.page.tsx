import React from "react";
import {useApiData} from "@sdk/dashboard";
import {Card, Container, Table} from "react-bootstrap";

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function UsersPage() {
  const data = useApiData<User[]>('/user/all');

  if (!data) return null;

  return (
    <Container>
      <Card>
        <Card.Header>Users</Card.Header>
        <Card.Body>
        <Table striped>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
          {
            data.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.name}</td>
                <td>{d.email}</td>
                <td>{d.role}</td>
              </tr>
            ))
          }
          </tbody>
        </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}