import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface AccountVerificationEmailProps {
  verifyUrl: string;
}

export function AccountVerificationEmail({ verifyUrl }: AccountVerificationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview children="Validez votre compte HealthAI" />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={logoStyle}>HealthAI</Heading>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={titleStyle}>
              Bienvenue sur HealthAI !
            </Heading>
            <Text style={textStyle}>
              Merci de vous être inscrit. Pour activer votre compte et commencer votre parcours
              santé, cliquez sur le bouton ci-dessous.
            </Text>
            <Section style={btnContainerStyle}>
              <Button href={verifyUrl} style={btnStyle}>
                Valider mon compte
              </Button>
            </Section>
            <Text style={textStyle}>
              Ce lien est valable <strong>24 heures</strong>.
            </Text>
            <Hr style={hrStyle} />
            <Text style={footerTextStyle}>
              Si vous n&apos;êtes pas à l&apos;origine de cette inscription, ignorez ce message.
            </Text>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>© {new Date().getFullYear()} HealthAI</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '560px',
};

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '28px 40px',
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  padding: '40px',
};

const titleStyle: React.CSSProperties = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: 700,
  marginBottom: '16px',
};

const textStyle: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '16px',
};

const btnContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
};

const btnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #2563EB, #10B981)',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '13px 28px',
  textDecoration: 'none',
  display: 'inline-block',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px 0',
};

const footerTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
};
