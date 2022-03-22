import { Button } from '@mui/material'
import { FieldArray, FieldProps } from 'formik'
import { cloneElement, MouseEventHandler } from 'react'
import { Person, PersonValues } from './Person'

interface PersonArrayProps {
  addLabel?: string
  deleteButtonTemplate?: JSX.Element
}

export const PersonArray: React.FC<PersonArrayProps & FieldProps> = (props) => {
  const addLabel = props.addLabel ?? 'Add'
  const fieldName = props.field.name
  const defaultVals: PersonValues = {
    firstName: '',
    lastName: '',
    email: ''
  }
  const deleteButtonTemplate = props.deleteButtonTemplate ?? <Button>Delete Person</Button>

  const fieldArr = (
    <FieldArray name={fieldName}>
      {({ push, remove, form }) => {
        const addButton = (
          <Button onClick={() => push(defaultVals)}>{addLabel}</Button>
        )

        const vals: PersonValues[] = form.values[fieldName]

        if (form.values.length === 0) {
          return addButton
        } else {
          return (
            <>
              {vals.map((_elem, index) => {
                const nameInner = `${fieldName}.${index}`
                const fInner = form.getFieldProps(nameInner)
                const mInner = form.getFieldMeta(nameInner)
                const deleteButton = cloneElement(deleteButtonTemplate, {onClick: () => remove(index), name: 'delete'})
                return (
                  <div key={nameInner}>
                    <Person
                      form={{ ...props.form }}
                      field={fInner}
                      meta={mInner}
                    />
                    {deleteButton}
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
