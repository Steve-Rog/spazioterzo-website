import { Container, Stack, Text, Title } from "@mantine/core";

export function meta() {
  return [
    { title: "Spazio Terzo" },
    { name: "description", content: "Spazio Terzo" },
  ];
}

export default function Home() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xs">
        <Title order={1}>Spazio Terzo</Title>
        <Text c="dimmed">Ambiente React, TypeScript e Mantine pronto.</Text>
      </Stack>
    </Container>
  );
}
