import {Button, ButtonGroup, Card, Col, Container, Row} from "react-bootstrap";
import {BsGithub, BsPatchCheckFill, BsPerson} from "react-icons/bs";
import React from "react";
import {ENV} from "./Auth";

export default function LoginWindow({login, apiInfo} : {login : (type : string) => void, apiInfo ?: string}) {
  return (
    <Container className='pt-5'>
      <Row className='justify-content-md-center'>
        <Col lg={4}>
          <Card>
            <Card.Header>Unauthorized</Card.Header>
            <Card.Body className='text-center'>
              <ButtonGroup vertical>
                <p>You are not authorized to access this app. Please verify your identity with GitHub.com.</p>
                <Button onClick={() => login('github')}>
                  <BsGithub/>&nbsp;
                  Log in with GitHub
                </Button>
                {
                  ENV === 'dev' && (
                    <>
                      <Button onClick={() => login('admin')}>
                        <BsPatchCheckFill/>&nbsp;
                        Log in as admin
                      </Button>
                      <Button onClick={() => login('user')}>
                        <BsPerson/>&nbsp;
                        Log in as user
                      </Button>
                    </>
                  )
                }
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {apiInfo &&
        <Row>
          <Col className='text-center mt-4'>
            <span className='text-muted'>API {apiInfo}</span>
          </Col>
        </Row>
      }
    </Container>
  );
}