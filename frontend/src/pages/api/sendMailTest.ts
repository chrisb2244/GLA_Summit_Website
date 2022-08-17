import { sendMailApi } from "@/lib/sendMail";
import type { NextApiHandler } from "next";

const sendMailTest: NextApiHandler = async (req, res) => {
  const now = Date.now().toString()
  return sendMailApi({
    to: 'chrisb2244@gmail.com',
    subject: 'test email',
    body: now,
    bodyPlain: now
  }).then((msg) => {
    console.log({msg, m:'client-side message print?'})
    res.status(200).send('success')
  }).catch((err) => {
    console.log(err)
    res.status(500).json(err)
  })

}

export default sendMailTest