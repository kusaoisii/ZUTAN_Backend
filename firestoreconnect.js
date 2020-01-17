const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");
const subjectData = require("./syllabus2019");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// const docRef = db.collection('syllabusData').doc('categories');

const pushCategory = categories => {
    categories.forEach(data => {
        const docRef = db.collection('categories').doc(`${data.categoryId}`);
        docRef.set({
            id: data.categoryId,
            name: data.categoryName
        });
    });
    const docRefAll = db.collection('categories').doc("all");
    const allCategories = categories.map(data => {
        return {
            name: data.categoryName,
            id: data.categoryId
        }
    });
    docRefAll.set({
        allCategories
    })
};

const pushFields = subjectData => {
    subjectData.forEach(categoryData => {
        const docRef = db.collection('fields').doc(`${categoryData.categoryId}`);
        const fieldData = categoryData.fields.map(field => {
            if (field.fieldId) {
                return {
                    name: field.fieldName,
                    id: field.fieldId
                }
            } else {
                return {
                    name: "",
                    id: `${categoryData.categoryId}00`
                }
            }
        });
        docRef.set({
            fieldData
        })
    })
};

const pushSubjects = subjectData => {
    subjectData.forEach(categoryData => {
        categoryData.fields.forEach(field => {
            if (field.fieldId) {
                const subjectsTmp = field.subjects;
                const docRef = db.collection('subjects').doc(`${field.fieldId}`);
                docRef.set({
                    fieldSubjects: subjectsTmp
                })
            } else {
                const docRef = db.collection('subjects').doc(`${categoryData.categoryId}00`);
                docRef.set({
                    fieldSubjects: categoryData.fields
                })
            }
        })
    })
};

const pushDetail = subjectData => {
    subjectData.forEach(categoryData => {
        categoryData.fields.forEach(field => {
            if (field.fieldId) {
                field.subjects.forEach(subjectData => {
                    const docRef = db.collection('details').doc(subjectData.subjectId);
                    docRef.set({
                        subjectData
                    })
                });

            } else {
                categoryData.fields.forEach((fieldsData) => {
                    const docRef = db.collection('details').doc(`${fieldsData.subjectId}`);
                    docRef.set({
                        fieldsData
                    })
                });
            }
        })
    })
};

pushCategory(subjectData);
pushFields(subjectData);
pushSubjects(subjectData);
pushDetail(subjectData);
