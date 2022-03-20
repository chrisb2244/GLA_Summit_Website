import { withFormik } from 'formik'
import { SubmitPresentationForm } from '../Components/Form/SubmitPresentationForm'

const PresentationSubmissionForm = () => {
  const Obj = withFormik({
    mapPropsToValues: () => ({ name: '' }),

    handleSubmit: (values, actions) => {
      console.log(values, actions)
      alert(JSON.stringify(values, null, 2))
      // actions.resetForm();
    }

  })(SubmitPresentationForm)

  return <Obj />
}

export default PresentationSubmissionForm
