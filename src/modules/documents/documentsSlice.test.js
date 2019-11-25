import cuid from 'cuid';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import reducer, {
  FilterTypes,
  initialState,
  editDocument,
  setFilter,
  addDocumentStart,
  addDocumentSuccess,
  addDocumentFailure,
  addDocument,
  syncDocumentsStart,
  syncDocumentsSuccess,
  syncDocumentsFailure,
  syncDirtyDocuments,
  selectIsLoading,
  selectError,
  selectDocument,
  selectAllDocuments,
  selectAllDocumentsCount,
  selectOnlyDirtyDocuments,
  selectOnlyDirtyDocumentsCount,
  selectFilteredDocumentsCount,
  selectFilteredDocuments,
} from './documentsSlice';
import api from '../../api';

jest.mock('../../api');

const createDocument = ({
  id = cuid(),
  author = 'John Doe',
  title = 'Unwritten Songs',
  content = 'Lorem ipsum',
  createdAt = new Date().toISOString(),
  isDirty = false,
  updatedAt,
} = {}) => ({
  id,
  author,
  title,
  content,
  createdAt,
  isDirty,
  updatedAt,
});

const createDocumentPatch = ({
  id,
  author,
  title,
  content,
  updatedAt = new Date().toISOString(),
} = {}) => {
  if (!id) {
    throw new Error('Document patches require an id');
  }

  return Object.entries({ id, author, title, content, updatedAt }).reduce(
    (acc, [key, value]) =>
      value === undefined ? acc : Object.assign(acc, { [key]: value }),
    {}
  );
};

const addDocuments = (documents, state = initialState) =>
  documents.reduce(
    (currentState, doc) => reducer(currentState, addDocumentSuccess(doc)),
    state
  );

const updateDocument = (documentPatch, state = initialState) =>
  reducer(state, editDocument(documentPatch));

describe('auth slice', () => {
  const mockStore = configureMockStore([thunk]);

  describe('reducer, action creators and selectors', () => {
    it('should return the initial state on first run', () => {
      // Arrange

      // Act
      const nextState = reducer(undefined, {});

      // Assert
      expect(nextState).toEqual(initialState);
    });

    it('[addDocument] should set loading and error state when an add document request is made', () => {
      // Arrange

      // Act
      const nextState = reducer(initialState, addDocumentStart());

      // Assert
      const rootState = { documents: nextState };
      expect(selectIsLoading(rootState)).toBe(true);
      expect(selectError(rootState)).toBe(null);
    });

    it('[addDocument] should set loading, error properties and add the new document when the request succeeds', () => {
      // Arrange
      const payload = createDocument();

      // Act
      const nextState = reducer(initialState, addDocumentSuccess(payload));

      // Assert
      const rootState = { documents: nextState };
      expect(selectDocument(rootState)(payload.id)).toEqual(payload);
      expect(selectAllDocumentsCount(rootState)).toBe(1);
      expect(selectAllDocuments(rootState)).toEqual([payload]);
    });

    it('[addDocument] should set loading and error when request fails', () => {
      // Arrange
      const error = new Error('Server unavailable');

      // Act
      const nextState = reducer(initialState, addDocumentFailure({ error }));

      // Assert
      const rootState = { documents: nextState };
      expect(selectIsLoading(rootState)).toBe(false);
      expect(selectError(rootState)).toBe(error.message);
    });

    it('[editDocument] should update the given properties in the document and mark it as dirty', () => {
      // Arrange
      const document = createDocument();
      const currentState = reducer(initialState, addDocumentSuccess(document));
      const payload = createDocumentPatch({
        id: document.id,
        author: 'Unknown',
        title: 'Yet another title',
        content: 'Lorem ipsum dolor sit amet',
      });

      // Act
      const nextState = reducer(currentState, editDocument(payload));

      // Assert
      const rootState = { documents: nextState };
      const updatedDocument = selectDocument(rootState)(document.id);
      expect(updatedDocument).toEqual(expect.objectContaining(payload));
      expect(updatedDocument.isDirty).toBe(true);
      expect(selectOnlyDirtyDocumentsCount(rootState)).toBe(1);
      expect(selectOnlyDirtyDocuments(rootState)).toEqual([updatedDocument]);
    });

    it('[filter] should return all documents when no filter is set', () => {
      // Arrange
      const cleanDocument = createDocument();
      const dirtyDocument = createDocument();
      const dirtyDocumentPatch = createDocumentPatch({ id: dirtyDocument.id });
      const currentState = updateDocument(
        dirtyDocumentPatch,
        addDocuments([cleanDocument, dirtyDocument])
      );

      // Act
      const nextState = reducer(
        currentState,
        setFilter({ filter: FilterTypes.NONE })
      );

      // Assert
      const rootState = { documents: nextState };
      const filteredDocIds = selectFilteredDocuments(rootState).map(
        ({ id }) => id
      );
      expect(selectFilteredDocumentsCount(rootState)).toBe(2);
      expect(filteredDocIds).toEqual([cleanDocument.id, dirtyDocument.id]);
    });

    it('[filter] should return only clean documents when ONLY_CLEAN filter is set', () => {
      // Arrange
      const cleanDocument = createDocument();
      const dirtyDocument = createDocument();
      const dirtyDocumentPatch = createDocumentPatch({ id: dirtyDocument.id });
      const currentState = updateDocument(
        dirtyDocumentPatch,
        addDocuments([cleanDocument, dirtyDocument])
      );

      // Act
      const nextState = reducer(
        currentState,
        setFilter({ filter: FilterTypes.ONLY_CLEAN })
      );

      // Assert
      const rootState = { documents: nextState };
      const filteredDocIds = selectFilteredDocuments(rootState).map(
        ({ id }) => id
      );
      expect(selectFilteredDocumentsCount(rootState)).toBe(1);
      expect(filteredDocIds).toEqual([cleanDocument.id]);
    });

    it('[filter] should return only dirty documents when ONLY_DIRTY filter is set', () => {
      // Arrange
      const cleanDocument = createDocument();
      const dirtyDocument = createDocument();
      const dirtyDocumentPatch = createDocumentPatch({ id: dirtyDocument.id });
      const currentState = updateDocument(
        dirtyDocumentPatch,
        addDocuments([cleanDocument, dirtyDocument])
      );

      // Act
      const nextState = reducer(
        currentState,
        setFilter({ filter: FilterTypes.ONLY_DIRTY })
      );

      // Assert
      const rootState = { documents: nextState };
      const filteredDocIds = selectFilteredDocuments(rootState).map(
        ({ id }) => id
      );
      expect(selectFilteredDocumentsCount(rootState)).toBe(1);
      expect(filteredDocIds).toEqual([dirtyDocument.id]);
    });

    it('[syncDocuments] should set loading and error state when a sync documents request is made', () => {
      // Arrange

      // Act
      const nextState = reducer(initialState, syncDocumentsStart());

      // Assert
      const rootState = { documents: nextState };
      expect(selectIsLoading(rootState)).toBe(true);
      expect(selectError(rootState)).toBe(null);
    });

    it("[syncDocuments] should set loading and error state and mark all sync'ed documents as clean when a sync documents request succeeds", () => {
      // Arrange
      const cleanDocument = createDocument();
      const dirtyDocument = createDocument();
      const dirtyDocumentPatch = createDocumentPatch({ id: dirtyDocument.id });
      const currentState = updateDocument(
        dirtyDocumentPatch,
        addDocuments([cleanDocument, dirtyDocument])
      );
      const payload = {
        documents: [{ id: dirtyDocument.id }],
      };

      // Act
      const nextState = reducer(currentState, syncDocumentsSuccess(payload));

      // Assert
      const rootState = { documents: nextState };
      expect(selectIsLoading(rootState)).toBe(false);
      expect(selectError(rootState)).toBe(null);
      expect(selectDocument(rootState)(dirtyDocument.id).isDirty).toBe(false);
    });

    it('[syncDocuments] should set loading and error state when a sync documents request fails', () => {
      // Arrange
      const error = new Error('Server unavailable');

      // Act
      const nextState = reducer(initialState, syncDocumentsFailure({ error }));

      // Assert
      const rootState = { documents: nextState };
      expect(selectIsLoading(rootState)).toBe(false);
      expect(selectError(rootState)).toBe(error.message);
    });
  });

  describe('thunks', () => {
    describe('add document', () => {
      it('creates both addDocumentStart and addDocumentSuccess when addDocument API call succeeds', async () => {
        // Arrange
        const document = createDocument({ id: null });
        const store = mockStore({ documents: initialState });

        const responsePayload = { ...document, id: cuid };
        api.addDocument.mockResolvedValueOnce(responsePayload);

        // Act
        await store.dispatch(addDocument(document));

        // Assert
        const expectedActions = [
          addDocumentStart(),
          addDocumentSuccess(responsePayload),
        ];
        expect(store.getActions()).toEqual(expectedActions);
      });

      it('creates both addDocumentStart and addDocumentFailure when addDocument API call fails', async () => {
        // Arrange
        const document = createDocument({ id: null });
        const store = mockStore({ documents: initialState });

        const error = new Error('Unavailable server');
        api.addDocument.mockRejectedValueOnce(error);

        // Act
        await store.dispatch(addDocument(document));

        // Assert
        const expectedActions = [
          addDocumentStart(),
          addDocumentFailure({ error }),
        ];
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('sync dirty documents', () => {
      it('creates both syncDocumentsStart and syncDocumentsSuccess when syncDocuments API call succeeds', async () => {
        // Arrange
        const cleanDocument = createDocument();
        const dirtyDocumentDraft = createDocument();
        const dirtyDocumentPatch = createDocumentPatch({
          id: dirtyDocumentDraft.id,
        });
        const currentState = updateDocument(
          dirtyDocumentPatch,
          addDocuments([cleanDocument, dirtyDocumentDraft])
        );
        const rootState = { documents: currentState };
        const dirtyDocument = selectDocument(rootState)(dirtyDocumentDraft.id);
        const store = mockStore(rootState);

        const responsePayload = [{ id: dirtyDocumentDraft.id }];
        api.syncDocuments.mockResolvedValueOnce(responsePayload);
        const spy = jest.spyOn(api, 'syncDocuments');

        // Act
        await store.dispatch(syncDirtyDocuments());

        // Assert
        const expectedActions = [
          syncDocumentsStart(),
          syncDocumentsSuccess({ documents: responsePayload }),
        ];
        expect(store.getActions()).toEqual(expectedActions);
        expect(spy).toHaveBeenCalledWith([dirtyDocument]);
      });

      it('creates both syncDocumentsStart and syncDocumentsFailure when syncDocuments API call fails', async () => {
        // Arrange
        const cleanDocument = createDocument();
        const dirtyDocumentDraft = createDocument();
        const dirtyDocumentPatch = createDocumentPatch({
          id: dirtyDocumentDraft.id,
        });
        const currentState = updateDocument(
          dirtyDocumentPatch,
          addDocuments([cleanDocument, dirtyDocumentDraft])
        );
        const rootState = { documents: currentState };
        const dirtyDocument = selectDocument(rootState)(dirtyDocumentDraft.id);
        const store = mockStore(rootState);

        const error = new Error('Unavailable server');
        api.syncDocuments.mockRejectedValueOnce(error);
        const spy = jest.spyOn(api, 'syncDocuments');

        // Act
        await store.dispatch(syncDirtyDocuments());

        // Assert
        const expectedActions = [
          syncDocumentsStart(),
          syncDocumentsFailure({ error }),
        ];
        expect(store.getActions()).toEqual(expectedActions);
        expect(spy).toHaveBeenCalledWith([dirtyDocument]);
      });
    });
  });
});
