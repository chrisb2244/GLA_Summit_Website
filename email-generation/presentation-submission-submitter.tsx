import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type PersonProps = {
  firstName: string;
  lastName: string;
  email: string;
};

type EmailProps = {
  email: string;
};

type PresentationType =
  | "7x7"
  | "full length"
  | "panel"
  | "15 minutes"
  | "quiz"
  | "session-container";

type PresentationFormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
  timeWindows: { windowStartTime: Date; windowEndTime: Date }[];
  isFinal: boolean;
};

const defaultArgs = (longEmail?: boolean): PresentationFormData => {
  return {
    title: "My Awesome Presentation",
    submitter: {
      firstName: "Chris",
      lastName: "B",
      email: longEmail
        ? "verylongemail.name.iputstuffhere.blahblah@gmail.com"
        : "sensibleemail@gmail.com",
    },
    abstract:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.\r\nIf you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.\r\nThe generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
    isFinal: true,
    learningPoints: "Stuff",
    otherPresenters: [], // [{ email: "bob@gmail.com" }, { email: "leah@ni.com" }],
    presentationType: "full length",
    timeWindows: [],
  };
};

const FormRow = (props: { label: string; value: string }) => {
  return (
    <tr>
      <td style={labelStyle}>{props.label}</td>
      <td style={tdStyle}>{props.value}</td>
    </tr>
  );
};

const OtherPresenterRows = (props: { presenters: EmailProps[] }) => {
  const nRows = props.presenters.length;
  if (nRows === 0) {
    return <FormRow label="Other Presenters:" value="None" />;
  }
  const otherRows = props.presenters.slice(1);
  return (
    <>
      <tr>
        <td style={labelStyle} rowSpan={nRows}>
          Other Presenters
        </td>
        <td style={tdStyle}>{props.presenters[0].email}</td>
      </tr>
      {otherRows.map(({ email }, idx) => {
        return (
          <tr key={`otherPresenter-${idx}`}>
            <td style={tdStyle}>{email}</td>
          </tr>
        );
      })}
    </>
  );
};

export const PresentationSubmission_SubmitterEmail = (
  data: PresentationFormData
) => {
  const name = `${data.submitter.firstName} ${data.submitter.lastName}`.trim();
  let typeText = "";
  switch (data.presentationType) {
    case "7x7": {
      typeText = "7x7 (7 minutes)";
      break;
    }
    case "15 minutes": {
      typeText = "Short Length (15 minutes)";
      break;
    }
    case "full length": {
      typeText = "Full Length (45 minutes)";
      break;
    }
    case "panel": {
      typeText = "Panel Discussion";
      break;
    }
  }

  return (
    <Html>
      <Head />
      <Preview>Thank you for submitting a presentation</Preview>
      <Body style={body}>
        <Container style={mainContainer}>
          <Heading style={heading}>GLA Summit 2024</Heading>
          <Container style={innerContainer}>
            <Text>Dear {name},</Text>
            <Text>
              Thank you for submitting a presentation for GLA Summit 2024!
            </Text>
            <Text>The data you submitted is shown below.</Text>
            <table style={formTable}>
              <FormRow label="Type" value={typeText} />
              <tr style={hrStyle}></tr>
              <FormRow label="Title" value={data.title} />
              <tr style={subhrStyle}></tr>
              <FormRow label="Abstract" value={data.abstract} />
              <tr style={subhrStyle}></tr>
              <FormRow label="Learning points" value={data.learningPoints} />
              <tr style={hrStyle}></tr>
              <FormRow label="Submitter Name" value={name} />
              <tr style={subhrStyle}></tr>
              <FormRow label="Submitter Email" value={data.submitter.email} />
              <tr style={hrStyle}></tr>
              <OtherPresenterRows presenters={data.otherPresenters} />
            </table>
          </Container>
        </Container>
      </Body>
    </Html>
  );
};

const useLongEmail = true;
export default () =>
  PresentationSubmission_SubmitterEmail(defaultArgs(useLongEmail));

const body = {
  backgroundColor: "#fff",
  fontFamily: "Roboto,sans-serif",
};

const mainContainer = {
  backgroundColor: "#fff",
  border: "1px solid #eee",
  borderRadius: "5px",
  boxShadow: "0 5px 10px rgba(20,50,70,.2)",
  marginTop: "20px",
  width: "360px",
  margin: "0 auto",
  padding: "68px 0 130px",
};

const heading = {
  color: "#444",
  fontSize: "32px",
  fontWeight: 700,
  textAlign: "center" as const,
};

const innerContainer = {
  width: "324px",
};

const formTable = {
  borderSpacing: "0px",
  borderCollapse: "collapse" as const,
  color: "#444",
  width: "100%",
  tableLayout: "fixed" as const,
};

const hrStyle = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#aaa",
};

const subhrStyle = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#ddd",
};

const tdStyle = {
  padding: "8px 0px",
  verticalAlign: "middle",
  wordWrap: "break-word" as const,
};

const labelStyle = {
  padding: "8px 8px 8px 0",
  verticalAlign: "middle",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  width: "100px",
};
