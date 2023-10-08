// import { FormData } from "@/Components/Form/PresentationSubmissionForm";
// import { FormSubmissionEmail } from "@/lib/presentationSubmissionHelpers";
// import { NextPage } from "next";

import { NextPage } from "next"

// const PreviewFormEmailPage: NextPage = (props) => {
//   const formData: FormData = {
//     title: 'Example Title',
//     abstract: 'A great abstract takes some time to write... Oh no, I still need more characters. Really, even more?\n' 
//     + '\n' 
//     + `Let's also have multiple lines, and some quotes... "blah blah"`,
//     learningPoints: 'Lots and lots of stuff... really, lots.\nLots and lots of stuff... really, lots.\n',
//     submitter: {
//       firstName: 'Christian',
//       lastName: 'Butcher',
//       email: 'chrisb2244@gmail.com'
//     },
//     otherPresenters: [{
//       firstName: 'Presenter',
//       lastName: 'One',
//       email: 'dummy.email@gmail.com'
//     },
//     {
//       firstName: 'Presenter',
//       lastName: 'Two',
//       email: 'dummy2.email@gmail.com'
//     }],
//     timeWindows: []
//   }

//   return <FormSubmissionEmail data={formData} />
// }

// export default PreviewFormEmailPage

const dummy: NextPage = () => {
  return <></>
}

export default dummy;

// const renderLoader = () => (
//   <Box
//     sx={{
//       display: 'inline-block',
//       width: '40px',
//       height: '40px',
//       '::after': {
//         content: '""',
//         display: 'block',
//         width: '30px',
//         height: '30px',
//         margin: '1px',
//         borderRadius: '50%',
//         border: '5px solid #ccc',
//         borderColor: '#ccc transparent #ccc transparent',
//         animation: 'loader 2s linear infinite',
//         '@keyframes loader': {
//           '0%': {
//             transform: 'rotate(0deg)'
//           },
//           '100%': {
//             transform: 'rotate(360deg)'
//           }
//         }
//       }
//     }}
//   ></Box>
// )
