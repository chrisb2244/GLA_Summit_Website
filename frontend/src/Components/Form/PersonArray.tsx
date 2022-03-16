import { Button } from '@mui/material'
import { FieldArray, FieldProps } from 'formik'
import { Person, PersonValues } from './Person'

type PersonArrayProps = {
  addLabel?: string
}

export const PersonArray: React.FC<PersonArrayProps & FieldProps> = (props) => {
  const addLabel = props.addLabel ?? 'Add'
  const fieldName = props.field.name
  const defaultVals: PersonValues = {
    firstName: '',
    lastName: '',
    email: ''
  }

  const fieldArr = (
    <FieldArray name={fieldName}>
      {({ push, remove, form }) => {
        const addButton = (
          <Button onClick={() => push(defaultVals)}>{addLabel}</Button>
        )

        const vals: Array<PersonValues> = form.values[fieldName]

        if (form.values.length === 0) {
          return addButton
        } else {
          return (
            <>
              {vals.map((_elem, index) => {
                const nameInner = `${fieldName}.${index}`
                const fInner = form.getFieldProps(nameInner)
                const mInner = form.getFieldMeta(nameInner)
                return (
                  <div key={nameInner}>
                    <Person
                      form={{ ...props.form }}
                      field={fInner}
                      meta={mInner}
                    />
                    <Button name="delete" onClick={() => remove(index)}>
                      Delete Person
                    </Button>
                  </div>
                )
              })}
              {addButton}
            </>
          )
        }
      }}
    </FieldArray>
  )
  return fieldArr
}
