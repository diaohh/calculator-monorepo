package service

// Evaluator evaluates a mathematical expression written with the operator catalogue declared
// in the model layer. It knows nothing about HTTP: it takes a string and returns either a
// number or a domain error.
type Evaluator interface {
	Evaluate(expression string) (float64, error)
}
