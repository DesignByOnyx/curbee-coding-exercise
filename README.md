# Curbee Code Exercise

This project uses [pnpm](https://pnpm.io/). To get started, clone the project and install dependencies and run the dev server:

```bash
pnpm install
pnpm dev
```

## API Requests

The project is currently using [tRPC](https://trpc.io/) for end-to-end type safety. The API is best consumed with `@trpc/client`. However, since there is no client code in the project, we will be using the tRPC REST API directly.

> NOTE: The tRPC REST API is generally not used directly as shown below. Instead, if a more traditional REST API is desired, we can register HTTP routes, invoke the same tRPC procedures server-side, and send the response. This lets us support two protocols with minimal duplication.

### Create an Appointment

```bash
curl --request POST \
  --url http://localhost:5173/trpc/appointment.createWithDetails \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/10.2.0' \
  --data '{
  "appointmentStartTime": "2023-09-01T16:00:00Z",
  "appointmentEndTime": "2023-09-01T18:00:00Z",
  "location": {
	  "line1": "123 Street",
		"city": "Acme",
		"state": "CA",
		"zipCode": "90210"
	},
  "customer": {
		"firstName": "John",
		"lastName": "Doe",
		"email": "john@doe.com",
		"phone": 1234567890
	},
  "vehicle": {
		"vin": "12345678901234567"
	}
}'
```

### Get all appointments

```bash
curl --request GET \
  --url http://localhost:5173/trpc/appointment.find
```

### Get an appointment by ID

```bash
curl --request GET \
  --url 'http://localhost:5173/trpc/appointment.get?input="<id>"'
```
