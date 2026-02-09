export async function paystackInitializeTransaction({ email, amountKobo, reference }) {
  const res = await fetch(`${process.env.PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.status) {
    const err = new Error(data?.message || "Paystack initialize failed");
    err.statusCode = 400;
    err.meta = data;
    throw err;
  }

  return data.data; 
}
