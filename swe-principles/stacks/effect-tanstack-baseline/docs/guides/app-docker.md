# App Docker Guide

This guide covers containerizing the application itself. Observability runs in LAOS and is documented separately.

## Build

```bash
docker build -t effect-tanstack-start .
```

## Run

```bash
docker run --rm \
  -p 3000:3000 \
  --env-file .env \
  effect-tanstack-start
```

## Notes

- LAOS runs outside this repo: `https://github.com/dtechvision/laos`
- Use `.env` with LAOS endpoints and DSNs.
