'use server';

export const submitNewPresentation = async (data: FormData) => {
  console.log(data);
  await new Promise((r) => setTimeout(r, 2000));
};
